import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

def test_email():
    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_APP_PASSWORD")
    
    print(f"Testing SMTP for: {gmail_user}")
    
    if not gmail_user or not gmail_pass:
        print("Error: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env")
        return

    msg = MIMEText("This is a test email from Canopy HR system.", "plain")
    msg["Subject"] = "Canopy HR - SMTP Test"
    msg["From"] = gmail_user
    msg["To"] = gmail_user # Send to self
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.set_debuglevel(1)
            server.starttls()
            server.login(gmail_user, gmail_pass)
            server.sendmail(gmail_user, gmail_user, msg.as_string())
        print("Success: Test email sent successfully!")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_email()
