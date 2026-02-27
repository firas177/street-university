from datetime import datetime, timedelta
from jose import jwt 
SECRET_KEY= "CHANGE_ME_IN_PROD"
ALGORITHM = "HS256"
EXPIRE_MINUTES = 60* 24
def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

