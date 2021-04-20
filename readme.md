-- User Registeration
	-- Email
	-- Phone
	-- Password
	-- Confirm Password 
	-- POST Data goes into redis through Django
	SCHEMA
	-- user ({Email, Phone, Password, Token, Verification_Code, alias, Location, Trackers, email_verified, last_update}})
	PROCESS
	-- Verify Exists (Redis serch) idx_users
	-- Verify Email, Phone, password and confirm password
	-- Create verify link
	-- Hash Password
	-- Store Password
	-- Send Verify link

-- Verify Email
	-- User click on verify link
	-- GET call to Django
	-- Verify verify_code and userid
	-- Change Verify code
	-- Set Email Verified to true
	-- Redirect to login

-- Login
	-- Phone
	-- Email
	-- Alias
	-- Password
	-- POST to BE
	-- Authenticte on Phone and Email and Password
	-- Check if email is verified
	-- Set alias
	-- update last_login
	-- Respond with User data ( Redis search ) idx_token

-- Forgot password
	-- Phone
	-- Email
	-- POST to BE
	-- Verify Phone and Email
	-- Create Verification_code
	-- Create Temp_password
	-- Send email

-- Reset password
	-- Phone
	-- Email
	-- Current password
	-- New Password
	-- Confirm New password
	-- POST to BE
	-- Verify Phone email and Current password
	-- Verify old == new
	-- Verify pass == confirm pass
	-- Update password
	-- Send mail

-- Add tracker
	-- Phone
	-- Email
	-- Token
	-- Tracker
	-- update data
	-- Respond with new data

-- Delete tracker
	-- Phone
	-- Email
	-- Token
	-- Tracker
	-- update data
	-- Respond with new data

-- Invite user
	-- Email of invitee
	-- Phone of invitee
	-- send mail

-- Filter user
	-- select user to be kept
	-- Fe fuctionality

-- Search/Locate user
	-- Redis search 

-- In App Webrtc call
	-- Pub sub
	-- SSE from Front end

-- Location
	-- Redis serch on all users with tracker as me ( idx:tracker)
	-- resond with location
	
