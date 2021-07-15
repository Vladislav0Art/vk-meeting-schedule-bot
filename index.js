const VkBot = require('node-vk-bot-api');
const User = require('./classes/User');
const configKeys = require('./config/keys');
const bot = new VkBot(configKeys.acccessToken);
const weatherAPI = require('./weatherAPI');

// added users
let subscribedUsers = [];

const commandsAndDescriptions = {
  'Start': 'Показывает список всех доступных команд и их описание.',

  '/subscribe': 'Запоминает пользователя. Команда необходыма, чтобы воспользоваться функциями бота.',

  '/unsubscribe': 'Удаляет пользователя.',
  
  '/create': 'Создает шаблон встречи.', 
  
  '/add_address [address]': 'Добавляет адрес в шаблон встечи. Вместо [address] впишите необходимый адрес.',
  
  '/add_date [date]': 'Добавляет место в шаблон встечи. Вместо [date] впишите необходимый день.',
  
  '/add_time [time]': 'Добавляет время в шаблон встечи. Вместо [time] впишите необходимое время.',

  '/add_description [description]': 'Добавляет описание Вашей встречи. Вместо [description] впишите необходимое описание.',
  
  '/invite [person_vk_id], [person_vk_id]': 'Добавляет позьзователя, которму прийдет оповещение о встречи. Вместо [person_vk_id] нужно указать id пользователя (чтобы пригласить несколько пользователей, укажите их id через запятую). Вы ипользуете его, когда обращаетесь к пользователю через значок @ в беседах (например: id1, vladislav0art и т.д.).',
  
  '/delete [person_vk_id], [person_vk_id]': 'Удаляет пользователя, id которого указан вместо [person_vk_id], если он был ранее добавлен (чтобы удалить несколько пользователей, укажите их id через запятую).',
  
  '/add_weather [city] [time]': 'Добавляет погоду в зависимости от выбранного дня (можно узнать погоду не более чем на 10 дней вперед). \n Формат ввода данных: \n [city] - город, на английском языке (например: Krasnodar, Moscow) \n [time] - время, необходимо указывать в следующем формате: yyyy-mm-dd hh:mm (например: 2021-07-15 01:00). Если не указывать время, то будет выводиться средняя температура дня.',
  
  '/discard': 'Удаляет текущий шаблон встречи.',
  
  '/status': 'Показывает всю информацию о текущем шаблоне встречи.',
  
  '/send': 'Производит отправку сообщения всем, кого Вы указали через команду /invite'
};


// catching errors
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    console.error(e);
  }
});


// getting user from subscribed users by id
const getUserById = (userId) => subscribedUsers.find(user => user.id === userId);


// searching index of user by id
const findIndexOfUserById = (userId) => subscribedUsers.findIndex(user => user.id === userId);


// checking if user exits in array
const isUserSubscribed = (userId) => getUserById(userId) ? true : false;


// setting isCreatingMeeting prop of user searched by id
const deleteUserMeetingData = (userId) => {
  const index = findIndexOfUserById(userId);
  subscribedUsers[index].isCreatingMeeting = false;
  subscribedUsers[index].meetingData.removeMeetingData();
};


// sending message to the user
const sendMessageToUser = (userId, msg) => {
  bot.sendMessage(userId, msg)
    .catch(err =>  console.error(err));
};


// getting id from context object
const getIdFromContext = context => {
  if(!context) {
    return console.error(`Context must not be ${context}`);
  }
  else if(!context.message) {
    return console.error(`Context message must not be ${context.message}`);
  }
  return context.message.user_id;
};


// adding invited people to the user
const AddInvitedPeopleToUser = (userId, people) => {
  const index = findIndexOfUserById(userId);
  subscribedUsers[index].meetingData.addNewInvitedPeople(people);
};


// removing invited people from the user
const RemoveInvitedPeopleFromUser = (userId, people) => {
  const index = findIndexOfUserById(userId);
  subscribedUsers[index].meetingData.removeInvitedPeople(people);
};


// creating message with props of meeting data
// const createDataPresentation = (data) => {
//   let message = "";
//   for (prop in data) {
//     if(data[prop] instanceof Array)
//       message += `${prop.substr(1)}: ${data[prop].length > 0 ? data[prop].join(', ') : 'no people invited'}\n`;
//     else
//       message += `${prop.substr(1)}: ${data[prop] ? data[prop] : 'not specified' }\n`;
//   }
//   return message;
// };


// getting ids of invited people
const getDataOfInvitedPeople = (invitedPeople) => new Promise((resolve, reject) => {
  bot.execute('users.get', {
    user_ids: invitedPeople,
  })
    .then(res => {
      const ids = [];
      const names = [];

      res.forEach(user => ids.push(user.id));
      res.forEach(user => names.push(`${user.first_name} ${user.last_name}`));

      if(ids.length !== invitedPeople.length) {
        return reject('Не удалось найти некоторых пользователей!');
      }
      resolve([ids, names]);
    })
    .catch((err) => {
      console.error(err);
      reject('Что-то пошло не так');
    });
});



// --- COMMANDS --- //

//  Start command
bot.command('Start', (ctx) => {
  const id = getIdFromContext(ctx);
  let message = "Meeting Schedule Bot поддреживает следующие команды:\n\n";
  
  for (command in commandsAndDescriptions)
    message += `${command}: ${commandsAndDescriptions[command]}\n\n`;

  message += '\n\n Для того, чтобы запланировать встречу, необходимо подписаться, используя команду /subscribe. Чтобы отписаться от возможностей бота используйте комманду /unsubscribe.'

  sendMessageToUser(id, message);
});


//  /subscribe command
bot.command('/subscribe', (ctx) => {
  const id = getIdFromContext(ctx);

  // if user is already added
  if(isUserSubscribed(id)) {
    return sendMessageToUser(id, 'Вы уже подписаны. Если Вы хотите отписаться, то используйте команду /unsubscribe.');
  }
  
  bot.execute('users.get', {
    user_ids: id
  })
    .then(res => {
      const username = `${res[0].first_name} ${res[0].last_name}`;
      const user = new User(id, username);

      subscribedUsers.push(user);
      sendMessageToUser(id, 'Вы успешно подписаны.');
    })
    .catch(err => {
      console.error(err);
      sendMessageToUser(id, 'Не получилось произвести подписку. Попробуйте еще раз!');
    });
});


//  /unsubscribe command
bot.command('/unsubscribe', (ctx) => {
  const id = getIdFromContext(ctx);
  if(!isUserSubscribed(id)) {
    return sendMessageToUser(id, 'Вы не подписаны на возможности данного бота. Чтобы подписаться, необходимо использовать команду /subscribe.');
  }

  subscribedUsers = subscribedUsers.filter(user => user.id !== id);
  sendMessageToUser(id, 'Вы упешно отписаны.');
});


//  /create command
bot.command('/create', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(user.isCreatingMeeting)
    return sendMessageToUser(id, 'Вы уже создаете шаблон встречи. Чтобы отметить создание шаблона, отправьте команду /discard.');

  
  const index = findIndexOfUserById(id);
  subscribedUsers[index].isCreatingMeeting = true;
  subscribedUsers[index].meetingData.removeMeetingData();

  sendMessageToUser(id, "Отлично! Теперь Вам необходимо указать адрес, время и место, а также указать людей, которых Вы хотите пригласить. \n Вы также можете добавить прогноз погоды на выбранную дату и место.");
});


//  /discard command
bot.command('/discard', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Вы не создаете шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  deleteUserMeetingData(id);
  sendMessageToUser(id, 'Шаблон встречи удален. Если хотите создать новый, воспользуйте командой /create.');
});


//  /add_address command
bot.command('/add_address', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  const len = String('/add_address').length;
  const address = ctx.message.body.trim().substr(len);

  if(address === '') {
    return sendMessageToUser(id, 'Адрес не может быть пустой строкой.');
  }

  // setting address to the user
  const index = findIndexOfUserById(id);
  subscribedUsers[index].meetingData.address = address;

  sendMessageToUser(id, 'Адрес установлен. Если Вы хотите изменить адрес, отправьте команду /add_address с новым адресом.')
});


//  /add_date command
bot.command('/add_date', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  const len = String('/add_date').length;
  const date = ctx.message.body.trim().substr(len);

  if(date === '') {
    return sendMessageToUser(id, 'Дата не может быть пустой строкой.');
  }

  // setting date to the user
  const index = findIndexOfUserById(id);
  subscribedUsers[index].meetingData.date = date;
  
  sendMessageToUser(id, 'Дата установлена. Если Вы хотите изменить дату, отправьте команду /add_date с новой датой.')
});



//  /add_time command
bot.command('/add_time', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  const len = String('/add_time').length;
  const time = ctx.message.body.trim().substr(len);

  if(time === '') {
    return sendMessageToUser(id, 'Время не может быть пустой строкой. Используйте формат: HH:MM:SS');
  }

  // setting time to the user
  const index = findIndexOfUserById(id);
  subscribedUsers[index].meetingData.time = time;
  
  sendMessageToUser(id, 'Время установлено. Если Вы хотите изменить время, отправьте команду /add_time с новым временем.')
});


//  /add_description command
bot.command('/add_description', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  const len = String('/add_description').length;
  const descr = ctx.message.body.trim().substr(len);

  // setting time to the user
  const index = findIndexOfUserById(id);
  subscribedUsers[index].meetingData.description = descr;
  
  sendMessageToUser(id, 'Описание успешно установлено. Если Вы хотите изменить описание, отправьте команду /add_description с новым описанием.')
});


//  /invite command
bot.command('/invite', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  const len = String('/invite').length;
  const people = ctx.message.body.trim().substr(len).split(',').map(person => person.trim()).filter(person => person !== '');

  if(people.length <= 0) {
    return sendMessageToUser(id, 'Неужели Вы не хотите никого приглашать? После команды /invite введите id пользователей, которые должны быть приглашены.');
  }

  // adding invited people
  AddInvitedPeopleToUser(id, people);
  sendMessageToUser(id, `Пользователи успешно приглашены. \n\n На встречу приглашены: ${ getUserById(id).meetingData.invitedPeople.join(', ') }.`);
});


//  /delete command
bot.command('/delete', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');
  else if(user.meetingData.invitedPeople.length <= 0)
    return sendMessageToUser(id, 'Ваш список приглашенных людей пуст. Чтобы добавить пользователя, используйте команду /invite.');

  const len = String('/delete').length;
  const people = ctx.message.body.trim().substr(len).split(',').map(person => person.trim()).filter(person => person !== '');

  if(people.length <= 0) {
    return sendMessageToUser(id, 'Вы не указали, кого хотите удалить из списка приглашенных.');
  }

  // removing invited people
  RemoveInvitedPeopleFromUser(id, people);
  sendMessageToUser(id, `Пользователи успешно удалены. \n\n Ваш список приглашенных: ${ getUserById(id).meetingData.invitedPeople.join(', ') }`);
});


//  /add_weather command
bot.command('/add_weather', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  const len = String('/add_weather').length;
  const data = ctx.message.body.trim().substr(len).split(' ').map(item => item.trim()).filter(item => item !== '');
  
  const [city = '', date = '', time = ''] = data;

  if(city === '' && date === '' && time === '') {
    return sendMessageToUser(id, 'Чтобы установить погоду, необходимо ввести город на английском языке, например: London, Moscow.');
  }

  weatherAPI(city, date, time)
    .then(weatherData => {
        // setting address to the user
        const index = findIndexOfUserById(id);
        subscribedUsers[index].meetingData.weather = `${weatherData.avgtemp_text}, ${weatherData.condition}`;
        sendMessageToUser(id, 'Погода успешно установлена. Если Вы хотите изменить город/время, отправьте команду /add_weather с новыми значениями, и прогноз погоды обновится.');
    })
    .catch(err => {
      console.error(err);
      sendMessageToUser(id, 'Не удалось установить погоду. Убедитесь, что Вы верно указали формат города и даты/времени.');
    });
});


//  /status command
bot.command('/status', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');


  getDataOfInvitedPeople(user.meetingData.invitedPeople)
    .then(res => {
      const [ids, names] = res;
      const message = user.meetingData.makePresentableMessage(user.username, names);
      sendMessageToUser(id, message);
    })
    .catch(err => {
      console.error(err);
      sendMessageToUser(id, 'Что-то пошло не так... Попробуйте еще раз!');
    });

});


//  /send command
bot.command('/send', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create.');

  
  const data = user.meetingData;
  let hasUnspecifiedFiled = false;

  for (prop in data) {
    if(data[prop] instanceof Array && data[prop].length <= 0) {
      hasUnspecifiedFiled = true;
    }
    else if(!(data[prop] instanceof Array) && !data[prop]) {
      hasUnspecifiedFiled = true;
    }
  }

  // if unspecified fields remained
  if(hasUnspecifiedFiled) {
    return sendMessageToUser(id, 'У Вас остались незаполненные поля. Отправьте команду /status, чтобы узнать, какие поля необходимо заполнить.');
  }

  getDataOfInvitedPeople(user.meetingData.invitedPeople)
    .then(res => {
      const [ids, names] = res;
      const message = user.meetingData.makePresentableMessage(user.username, names);

      // sending data to invited people
      bot.sendMessage(ids, message)
      .then(() => {
        deleteUserMeetingData(id);
        sendMessageToUser(id, 'Приглашения успешно отправлены! Желаю хорошо провести время. Шаблон этой встречи удален.');
      })
      .catch(err => {
        console.error(err);
        sendMessageToUser(id, 'Что-то пошло не так... Попробуйте отправить приглашения еще раз.');
      });

    })
    .catch(err => {
      console.error(err);
      sendMessageToUser(id, 'Что-то пошло не так... Попробуйте отправить приглашения еще раз.');
    });
});




// starting listening
bot.startPolling((err) => {
  if (err) {
    console.error(err);
  }
});