class MeetingData {
  constructor(id) {
    this._invitingPerson = id;
    this._address = null;
    this._date = null;
    this._time = null;
    this._description = '';
    this._invitedPeople = [];
    this._weather = 'не установлено';
    
    this._labels = {
      invitingPerson: 'Вас приглашает: ',
      address: 'Адрес: ',
      date: 'Когда: ',
      time: 'Время: ',
      invitedPeople: 'Также приглашены: ',
      description: 'Описание: ',
      weather: 'Погода будет: ' 
    };
  }

  // getting labels
  get labels() {
    return this._labels;
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


  // weather interface
  get weather() {
    return this._weather;
  }
  set weather(details) {
    this._weather = details;
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
    this._weather = 'не установлено';
  }


  makePresentableMessage(username, invitedPeopleNames) {
    const labels = this.labels;
    let message = 'Здравствуйте, Вас пригласили на встречу! Информация о встрече приведена ниже: \n\n';
    
    for(const field in labels) {
      if(this[field] instanceof Array) {
        if(field === 'invitedPeople')
          message += `${labels[field]} ${invitedPeopleNames.length > 0 ? invitedPeopleNames.join(', ') : 'нет пользователей'}`;
        else
          message += `${labels[field]} ${this[field].length ? this[field].join(', ') : 'не заполнено'}`;
      }
      else {
        if(field === 'invitingPerson')
          message += `${labels[field]} ${username ? username : 'не заполнено'}`;
        else
          message += `${labels[field]} ${this[field] ? this[field] : 'не заполнено'}`;
      }

      message += '\n';
    }

    return message;
  }
};

module.exports = MeetingData;