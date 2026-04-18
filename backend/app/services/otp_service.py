import logging
import hashlib
from typing import Optional

logger = logging.getLogger(__name__)

# Usually read from settings
OTP_PROVIDER = "console"

class OTPService:
    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hashes an OTP using SHA-256 for fast, secure Redis/DB storage."""
        return hashlib.sha256(otp.encode()).hexdigest()
    @staticmethod
    async def send_otp(mobile: str, otp: str, college_id: str) -> None:
        """
        Sends an OTP using the configured provider.
        """
        if OTP_PROVIDER == "console":
            logger.info(f"[OTP DEV] Sending OTP to {mobile} for college {college_id}: {otp}")
            print(f"--- [OTP DEV] Sending OTP to {mobile} for college {college_id}: {otp} ---")
        elif OTP_PROVIDER == "aws_sns":
            await OTPService._send_via_sns(mobile, otp)
        elif OTP_PROVIDER == "twilio":
            await OTPService._send_via_twilio(mobile, otp)
        else:
            logger.error(f"Unknown OTP provider configured: {OTP_PROVIDER}")
            raise ValueError(f"Unknown OTP provider: {OTP_PROVIDER}")

    @staticmethod
    async def _send_via_sns(mobile: str, otp: str) -> None:
        # TODO: Implement AWS SNS Boto3 client integration
        pass

    @staticmethod
    async def _send_via_twilio(mobile: str, otp: str) -> None:
        # TODO: Implement Twilio integration
        pass
