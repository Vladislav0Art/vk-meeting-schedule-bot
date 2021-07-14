const MeetingData = require('./MeetingData');

class User {
  constructor(id) {
    this._id = id;
    this._isCreatingMeeting = false;
    this._meetingData = new MeetingData(id);
  }

  // id interface
  get id() {
    return this._id;
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