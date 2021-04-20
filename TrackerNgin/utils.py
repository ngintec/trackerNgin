
def HashPassword(password):
    import hashlib
    hash = hashlib.sha512( str( password ).encode("utf-8") ).hexdigest()
    return hash

def GenerateToken(length):
    import random
    import string
    lower = string.ascii_lowercase
    upper = string.ascii_uppercase
    digits = "0123456789"
    final = digits+lower+upper
    token=''.join(random.choice(final) for i in range(length))
    return token

def ValidateInput(user_data):
    if  'id' in user_data.keys() and 'password' in user_data.keys() and 'email' in user_data.keys() and 'confirmpassword' in user_data.keys():
        if user_data['password'] == user_data['confirmpassword']:
            return True, None
        else:
            return False, "Password and Confirm Password should be same"
    else:
        return False, "Missing mandatory fields ( Phone, Email, password, confirmpassword)"