const twilio = require("twilio");
const config = require('../config/config');

console.log(process.env.TWILIO_PHONE_NUMBER)

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendOTP = async (phone, otp) => {
  return client.messages.create({
    body: `Your verification code is ${otp}. Please enter this code to complete your verification.
Do not share this code with anyone.

Thank you,
- Team HouseHunt`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

exports.deleteOtp = async (phone, otp) => {
  return client.messages.create({
    body: `Your HouseHunt account deletion OTP is ${otp}. Please enter this code to confirm your account deletion request.

Do not share this code with anyone.
If you did not request this, please ignore this message.

Thank you,
- Team HouseHunt`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

exports.deleteAccount = async (username, phone) => {
  try {
    console.log("Sending deletion SMS to:", username, phone);

    const message = await client.messages.create({
      body: `${username}, your HouseHunt account has been deleted. If this was not you, contact support at 123456789. - Team HouseHunt`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });


    console.log("Message sent successfully:", message.sid);
    return message;
  } catch (error) {
    console.error("Error sending deletion SMS:", error);
    return { error: "Failed to send deletion SMS. Please try again." };
  }
};
