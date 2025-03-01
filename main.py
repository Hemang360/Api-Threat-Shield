from fastapi import FastAPI, Request, HTTPException, Depends
import logging
import redis
import re
import time
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Initialize API
app = FastAPI()
FastAPIInstrumentor.instrument_app(app)

# OpenTelemetry Setup
tracer = TracerProvider()
tracer.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4317")))

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_mirage")

# Redis for Rate Limiting & Attack Detection
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
RATE_LIMIT = 5  # Max requests per minute per IP
BLOCK_DURATION = 300  # Block attacker for 5 minutes after malicious activity

# SQL Injection Patterns
SQLI_PATTERNS = [
    r"(?i)(union.*select.*from)",  # Detects UNION SELECT attacks
    r"(?i)(' or '1'='1)",         # SQL Injection pattern
    r"(?i)(--|#|;|/\*|\*/)",       # SQL comment patterns
]

# Function to detect malicious activity
def detect_attack(payload: str) -> bool:
    """Check if payload contains SQL Injection or malicious patterns."""
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, payload):
            return True
    return False

# Rate Limiting & Attack Prevention Middleware
def rate_limiter(request: Request):
    client_ip = request.client.host
    rate_key = f"rate_limit:{client_ip}"
    attack_key = f"failed_attempts:{client_ip}"
    block_key = f"blocked:{client_ip}"

    # Check if the IP is already blocked
    if redis_client.exists(block_key):
        logger.warning(f"Blocked IP {client_ip} attempted access")
        raise HTTPException(status_code=403, detail="Access denied due to repeated malicious activity.")

    # Rate Limiting
    request_count = redis_client.get(rate_key)
    if request_count is None:
        redis_client.setex(rate_key, 60, 1)
    else:
        if int(request_count) >= RATE_LIMIT:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            raise HTTPException(status_code=429, detail="Too many requests")
        redis_client.incr(rate_key)

@app.get("/status")
def status():
    return {"status": "API is running"}

@app.post("/login")
def login(username: str, password: str, request: Request, limiter: None = Depends(rate_limiter)):
    client_ip = request.client.host
    attack_key = f"failed_attempts:{client_ip}"
    block_key = f"blocked:{client_ip}"

    # Check for SQL Injection or attack patterns
    if detect_attack(username) or detect_attack(password):
        redis_client.incr(attack_key)
        redis_client.expire(attack_key, BLOCK_DURATION)
        redis_client.set(block_key, 1, ex=BLOCK_DURATION)  # Block IP
        logger.warning(f"🔴 Attack detected from {client_ip}! Payload: {username}, {password}")
        raise HTTPException(status_code=400, detail="Malicious activity detected.")

    logger.info(f"Login attempt from {client_ip} - User: {username}")
    return {"message": "Fake login successful", "token": "xyz123"}  # Fake response

@app.get("/data")
def get_data(request: Request, limiter: None = Depends(rate_limiter)):
    logger.info(f"Data request from {request.client.host}")
    return {"data": "Sensitive info (but fake)"}  # Fake sensitive data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
