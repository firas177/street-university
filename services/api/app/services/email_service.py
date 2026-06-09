import logging
import os

import requests

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class EmailServiceError(Exception):
    pass


def _get_config():
    return {
        "api_key": os.getenv("BREVO_API_KEY", ""),
        "sender_email": os.getenv("BREVO_SENDER_EMAIL", ""),
        "sender_name": os.getenv("BREVO_SENDER_NAME", "Street University"),
        "frontend_url": os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/"),
    }


def _build_reset_password_html(reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td>
              <p style="margin:0 0 8px;color:#2563eb;font-size:13px;font-weight:700;letter-spacing:0.04em;">STREET UNIVERSITY</p>
              <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;line-height:1.3;">Réinitialisation de votre mot de passe</h1>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">Bonjour,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Vous avez demandé la réinitialisation de votre mot de passe.
                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
              </p>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="{reset_url}"
                   style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">
                  Réinitialiser mon mot de passe
                </a>
              </p>
              <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.6;">
                Ce lien expire dans <strong>15 minutes</strong>.
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                Votre mot de passe restera inchangé.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    config = _get_config()

    if not config["api_key"]:
        raise EmailServiceError("BREVO_API_KEY non configurée.")
    if not config["sender_email"]:
        raise EmailServiceError("BREVO_SENDER_EMAIL non configurée.")

    reset_url = f"{config['frontend_url']}/reset-password?token={reset_token}"

    payload = {
        "sender": {
            "name": config["sender_name"],
            "email": config["sender_email"],
        },
        "to": [{"email": to_email}],
        "subject": "Réinitialisation de votre mot de passe - Street University",
        "htmlContent": _build_reset_password_html(reset_url),
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": config["api_key"],
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.error("Erreur réseau lors de l'envoi email Brevo: %s", exc.__class__.__name__)
        raise EmailServiceError("Impossible de contacter le service d'envoi d'emails.") from exc

    if response.status_code >= 400:
        logger.error(
            "Erreur Brevo (HTTP %s): %s",
            response.status_code,
            response.text[:500],
        )
        raise EmailServiceError("Le service d'envoi d'emails a renvoyé une erreur.")

    logger.info("Email de réinitialisation envoyé à %s", to_email)
