const MeetingData = require('./MeetingData');

class User {
  constructor(id, username) {
    this._id = id;
    this._username = username;
    this._isCreatingMeeting = false;
    this._meetingData = new MeetingData(id);
  }

  // id interface
  get id() {
    return this._id;
  }

  // username interface
  get username() {
    return this._username;
  }

  // isCreatingMeeting interface
  get isCreatingMeeting() {
    return this._isCreatingMeeting;
  }
  set isCreatingMeeting(value) {
    this._isCreatingMeeting = value;
  }


  // meetingData interface
  get meetingData() {
    return this._meetingData;
  }
};


module.exports = User;