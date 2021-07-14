class MeetingData {
  constructor(id) {
    this._invitingPerson = id;
    this._address = null;
    this._date = null;
    this._time = null;
    this._description = '';
    this._invitedPeople = [];
    this._weather = 'coming soon...';
  }

  // invitingPerson interface
  get invitingPerson() {
    return this._invitingPerson
  }

  // address interface
  get address() {
    return this._address;
  }
  set address(newAddress) {
    this._address = newAddress;
  }


  // date interface
  get date() {
    return this._date;
  }
  set date(newDate) {
    this._date = newDate;
  }


  // time interface
  get time() {
    return this._time;
  }
  set time(newTime) {
    this._time = newTime;
  }


  // description interface
  get description() {
    return this._description;
  }
  set description(newDescr) {
    this._description = newDescr;
  }


  // invitedPeople interface
  get invitedPeople() {
    return this._invitedPeople;
  }
  findInvitedPerson(id) {
    return this._invitedPeople.contains(id);
  }
  clearInvitedPeople() {
    this._invitedPeople = [];
  }
  addNewInvitedPeople(people) {
    if(!(people instanceof Array)) return;

    people.forEach(person => {
      // if person has not been added before
      if(!this.invitedPeople.includes(person))
        this._invitedPeople.push(person)
    });
  }
  removeInvitedPeople(peopleToRemove) {
    if(!(peopleToRemove instanceof Array)) return;
    this._invitedPeople = this._invitedPeople.filter(invitedPersonId => !peopleToRemove.includes(invitedPersonId));
  }

  removeMeetingData() {
    this._address = null;
    this._date = null;
    this._time = null;
    this._description = '';
    this._invitedPeople = [];
    this._weather = 'coming soon...';
  }

  // weather interface
  get weather() {
    return this._weather;
  }
  set weather(details) {
    this._weather = details;
  }
};

module.exports = MeetingData;