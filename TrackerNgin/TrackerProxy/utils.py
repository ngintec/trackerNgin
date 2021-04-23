import traceback, logging

logger=logging.getLogger("utils")
#this contains all functions that are helpers

#hash users password
def HashPassword(password):
    import hashlib
    hash = hashlib.sha512( str( password ).encode("utf-8") ).hexdigest()
    return hash

#generate a token of given length, longer the better but , note the url limit
def GenerateToken(length):
    import random
    import string
    lower = string.ascii_lowercase
    upper = string.ascii_uppercase
    digits = "0123456789"
    final = digits+lower+upper
    token=''.join(random.choice(final) for i in range(length))
    return token

#validate input posted for register and auth , this is second level 
def ValidateInput(user_data):
    if  'id' in user_data.keys() and 'password' in user_data.keys() and 'email' in user_data.keys() and 'confirmpassword' in user_data.keys():
        if user_data['password'] == user_data['confirmpassword']:
            return True, None
        else:
            return False, "Password and Confirm Password should be same"
    else:
        return False, "Missing mandatory fields ( Phone, Email, password, confirmpassword)"

# handle various emails scenarios
# register
def SendRegisterMail(email_to, code, phone, request_origin):
    url="{origin}/dev/verifyemail?uc={code}&id={id}".format(origin=request_origin,code=code, id=phone)
    body=GetRegisterEmailBody(email_to, url)
    subject="Registration Success for TrackerNgin"
    status, message=SendMail("vcbot@ngintec.com", [email_to], body, subject)
    return message, status


def GetRegisterEmailBody(to, url):
    return '<html>\
            <body style="background-color:#E0ECF8">\
            <h4> Dear {to} </h4>\
            <p> Thankyou for registering with TrackerNgin</p>\
            <p> Please click below and verify you email address before logging in</p>\
            <a href="{url}"> Click here to verify your email address </a>\
            <h4>Regds</h4>\
            <h4>TrackerNgin team</h4>\
            <p></p>\
            <p></p>\
            <p>****This is a system generated mail, responses are not monitored******</p>\
            </body>\
            </html>'.format(to=to.split("@")[0], url=url)

# forgot password
def SendTempPassword(message, email_to):
    body=GetTempPasswordEmailBody(email_to, message)
    subject="Temporary password for TrackerNgin"
    status, message=SendMail("vcbot@ngintec.com", [email_to], body, subject)
    return message, status


def GetTempPasswordEmailBody(to, password):
    return '<html>\
            <body style="background-color:#E0ECF8">\
            <h4> Dear {to} </h4>\
            <p> Please find below your Temporary password</p>\
            <p> You are requested to use this once to login and change the password</p>\
            <p> {temp} </p>\
            <h4>Regds</h4>\
            <h4>TrackerNgin team</h4>\
            <p></p>\
            <p></p>\
            <p>****This is a system generated mail, responses are not monitored******</p>\
            </body>\
            </html>'.format(to=to.split("@")[0], temp=password)


# invite and
def SendInviteMails(email_from, email_to, request_origin):
    url="{}/tracker".format(request_origin)
    subject="Invitation to TrackerNgin Platform"
    body=GetInviteEmailBody(email_from, email_to, url)
    status, message=SendMail("vcbot@ngintec.com", [email_to, email_from], body, subject)
    return message, status


def GetInviteEmailBody(email_from, email_to, url):
    return '<html>\
            <body style="background-color:#E0ECF8">\
            <h4> Dear {to} </h4>\
            <p> You have been invited onto teh TrackerNgin platform by {inviter}</p>\
            <ul> On this Platform:\
            <li> You can locate a user who has assigned you as his tracker</li>\
            <li> You can also add a user(Phone and email) as you tracker enabling him to locate you</li>\
            </ul>\
            <a href="{url}"> Click here to Register </a>\
            <h4>Regds</h4>\
            <h4>TrackerNgin team</h4>\
            <p></p>\
            <p></p>\
            <p>****This is a system generated mail, responses are not monitored******</p>\
            </body>\
            </html>'.format(to=email_to.split("@")[0],  url=url, inviter=email_from.split("@")[0])

#connect to smtp and send email
def SendMail(email_from, email_to, email_body, subject):
    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
    
        
        msg = MIMEMultipart()
        
        msg_text = MIMEText(email_body, 'html')
        msg.attach(msg_text)
        
        msg['Subject'] = subject
        msg['From'] = email_from
        msg['To'] = email_to[0]
        if len(email_to) > 1:
            msg['cc'] = email_to[1]
        
        
        server = smtplib.SMTP(host="email-smtp.ap-south-1.amazonaws.com" ,port=587)
        server.starttls()
        server.login('AKIATMZTIAC7UUBQ3Z6G', 'BJLaOMyyC8xN/qLF9wD4tF63BMjm4ehaPkwny2KYnbSi')
        
        
        server.sendmail(email_from, email_to, msg.as_string())
        server.close()
        return True, ""
    except Exception as e:
        traceback.print_exc()
        pass
        return False, "Error sending Confirmation Email"



