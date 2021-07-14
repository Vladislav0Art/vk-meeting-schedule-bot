const VkBot = require('node-vk-bot-api');
const User = require('./classes/User');
const configKeys = require('./config/keys');
const bot = new VkBot(configKeys.acccessToken);


// added users
let subscribedUsers = [];

const commandsAndDescriptions = {
  'Start': 'Показывает список всех доступных команд и их описание.',

  '/subscribe': 'Запоминает пользователя. Команда необходыма, чтобы воспользоваться функциями бота.',

  '/unsubscribe': 'Удаляет пользователя.',
  
  '/create_new_meeting': 'Создает шаблон встречи.', 
  
  '/add_address [address]': 'Добавляет адрес в шаблон встечи. Вместо [address] впишите необходимый адрес.',
  
  '/add_date [date]': 'Добавляет место в шаблон встечи. Вместо [date] впишите необходимый день.',
  
  '/add_time [time]': 'Добавляет время в шаблон встечи. Вместо [time] впишите необходимое время.',

  '/add_description [description]': 'Добавляет описание Вашей встречи (необязательное поле). Вместо [description] впишите необходимое описание.',
  
  '/invite [person_vk_id], [person_vk_id]': 'Добавляет позьзователя, которму прийдет оповещение о встречи. Вместо [person_vk_id] нужно указать id пользователя (чтобы пригласить несколько пользователей, укажите их id через запятую). Вы ипользуете его, когда обращаетесь к пользователю через значок @ в беседах (например: id1, vladislav0art и т.д.).',
  
  '/delete [person_vk_id], [person_vk_id]': 'Удаляет пользователя, id которого указан вместо [person_vk_id], если он был ранее добавлен (чтобы удалить несколько пользователей, укажите их id через запятую).',
  
  '/add_weather': 'Добавляет погоду в зависимости от выбранного дня.',
  
  '/discard_meeting': 'Удаляет текущий шаблон встречи.',
  
  '/meeting_status': 'Показывает всю информацию о текущем шаблоне встречи.',
  
  '/send_meeting': 'Производит отправку сообщения всем, кого Вы указали через команду /invite'
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
const createDataPresentation = (data) => {
  let message = "";
  for (prop in data) {
    if(data[prop] instanceof Array)
      message += `${prop.substr(1)}: ${data[prop].length > 0 ? data[prop].join(', ') : 'no people invited'}\n`;
    else
      message += `${prop.substr(1)}: ${data[prop] ? data[prop] : 'not specified' }\n`;
  }
  return message;
};


// getting ids of invited people
const getIdsOfInvitedPeople = (invitedPeople) => new Promise((resolve, reject) => {
  bot.execute('users.get', {
    user_ids: invitedPeople,
  })
    .then(res => {
      const ids = [];
      res.forEach(user => ids.push(user.id));

      if(ids.length !== invitedPeople.length) {
        throw new Error('Не удалось найти некоторых пользователей!');
      }

      resolve(ids);
    })
    .catch((err) => reject(err));
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
  
  const user = new User(id);

  subscribedUsers.push(user);
  sendMessageToUser(id, 'Вы успешно подписаны.');
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


//  /create_new_meeting command
bot.command('/create_new_meeting', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(user.isCreatingMeeting)
    return sendMessageToUser(id, 'Вы уже создаете шаблон встречи. Чтобы отметить создание шаблона, отправьте команду /discard_meeting.');

  
  const index = findIndexOfUserById(id);
  subscribedUsers[index].isCreatingMeeting = true;
  subscribedUsers[index].meetingData.removeMeetingData();

  sendMessageToUser(id, "Отлично! Теперь Вам необходимо указать адрес, время и место, а также указать людей, которых Вы хотите пригласить. \n Вы также можете добавить прогноз погоды на выбранную дату и место.");
});


//  /discard_meeting command
bot.command('/discard_meeting', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Вы не создаете шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

  deleteUserMeetingData(id);
  sendMessageToUser(id, 'Шаблон встречи удален. Если хотите создать новый, воспользуйте командой /create_new_meeting.');
});


//  /add_address command
bot.command('/add_address', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

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
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

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
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

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
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

  const len = String('/add_description').length;
  const descr = ctx.message.body.trim().substr(len);

  // setting time to the user
  const index = findIndexOfUserById(id);
  subscribedUsers[index].meetingData.description = descr;
  
  sendMessageToUser(id, 'Описание установлено. Если Вы хотите изменить описание, отправьте команду /add_description с новым описанием.')
});


//  /add_description command
bot.command('/invite', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

  const len = String('/invite').length;
  const people = ctx.message.body.trim().substr(len).split(',').map(person => person.trim()).filter(person => person !== '');

  if(people.length <= 0) {
    return sendMessageToUser(id, 'Неужели Вы не хотите никого приглашать? После команды /invite введите id пользователей, которые должны быть приглашены.');
  }

  // adding invited people
  AddInvitedPeopleToUser(id, people);
  // console.log(subscribedUsers[0].meetingData.invitedPeople);
  sendMessageToUser(id, `Пользователи успешно приглашены. \n\n На встречу приглашены: ${ getUserById(id).meetingData.invitedPeople.join(', ') }.`);
});


//  /add_description command
bot.command('/delete', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');
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


//  /meeting_status command
bot.command('/meeting_status', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

  const data = user.meetingData;
  const message = createDataPresentation(data);

  sendMessageToUser(id, message);
});


//  /send_meeting command
bot.command('/send_meeting', (ctx) => {
  const id = getIdFromContext(ctx);
  const user = getUserById(id);

  if(!user)
    return sendMessageToUser(id, 'Чтобы воспользоваться возможностями бота, необходимо подписаться. Для этого отправьте команду /subscribe.');
  else if(!user.isCreatingMeeting)
    return sendMessageToUser(id, 'Чтобы добавлять данные, необходимо создать шаблон встречи. Если Вы хотите создать его, воспользуйтесь командой /create_new_meeting.');

  
  const data = user.meetingData;
  let hasUnspecifiedFiled = false;
  let errorMessage = "Для следующих полей не установлены значения: ";

  for (prop in data) {
    if(data[prop] instanceof Array && data[prop].length <= 0) {
      errorMessage += `${ hasUnspecifiedFiled && ',' } ${prop.substr(1)}`;
      hasUnspecifiedFiled = true;
    }
    else if((data[prop] instanceof Array) && !data[prop] && prop !== '_description') {
      errorMessage += `${ hasUnspecifiedFiled && ',' } ${prop.substr(1)}`;
      hasUnspecifiedFiled = true;
    }
  }

  // if unspecified fields remained
  if(hasUnspecifiedFiled) {
    return sendMessageToUser(id, errorMessage);
  }

  getIdsOfInvitedPeople(user.meetingData.invitedPeople)
    .then(ids => {
      const message = createDataPresentation(data);

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
    });
});




// starting listening
bot.startPolling((err) => {
  if (err) {
    console.error(err);
  }
});



/*
* important code piece

  const id = ctx.message.user_id;
  bot.execute('users.get', {
    user_ids: 'vladislav0art',
  })
    .then(res => console.log(res))
    .catch(err => console.error(err));

*/
