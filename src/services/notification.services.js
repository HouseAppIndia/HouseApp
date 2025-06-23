const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');


const pushSystemNotification = () => {
  return User.getNotificationData()
}

const handleNotificationAction = async (id, source) => {
  try {
    
    const value = id; // or address if source is office_address
    const response = await User.verifyLocation({ source, value });
    console.log(value,response,"Coooooo")

    if (response.success) {
      console.log("✅ Success:", response.message);
    } else {
      console.warn("⚠️ Failed:", response.message);
    }

    return response;
  } catch (error) {
    console.error("❌ Error in handleNotificationAction:", error);
    return { success: false, message: "Something went wrong." };
  }
}
;
const handleNotificationDecline =async(id, source)=>{
   try {
    
    const value = id; // or address if source is office_address
    const response = await User.DelcineData({ source, value });
    console.log(value,response,"Coooooo")

    if (response.success) {
      console.log("✅ Success:", response.message);
    } else {
      console.warn("⚠️ Failed:", response.message);
    }

    return response;
  } catch (error) {
    console.error("❌ Error in handleNotificationAction:", error);
    return { success: false, message: "Something went wrong." };
  }
}

const DataCount =()=>{
  return User.getAllDataCount()
}

const getNotificationCount=()=>{
  return User.NotificationCount()
}



module.exports = {
  pushSystemNotification,
  handleNotificationAction,
  DataCount,
  getNotificationCount,
  handleNotificationDecline
};