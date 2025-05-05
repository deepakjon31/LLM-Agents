-- Find the user ID for the phone number
SELECT id FROM users WHERE mobile_number = '8050518293';

-- Find the admin role ID
SELECT id FROM roles WHERE name = 'admin';

-- Update the user's primary role to admin
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') 
WHERE mobile_number = '8050518293';

-- Set is_admin flag to true
UPDATE users SET is_admin = true WHERE mobile_number = '8050518293';

-- Verify the change
SELECT id, mobile_number, role_id, is_admin FROM users WHERE mobile_number = '8050518293'; 