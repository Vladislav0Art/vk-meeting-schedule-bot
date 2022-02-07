# VK Meeting Schedule Bot

If you have cloned the repo, do not forget to create file `keys.js` with the following code:
```javascript
module.exports = {
  acccessToken: '<your_acccess_token>',
  weatherAPI: {
    key: '<your_acccess_token_of_weatherapi>', // https://www.weatherapi.com/
    baseUrl: 'https://api.weatherapi.com/v1/forecast.json',
    days: 10
  }
};
```

You can try this bot online [here](https://vk.com/meeting_schedule_bot). 

There are several commands this bot supports:

1. `Start`: Shows available commands

2.  `/subscribe`: Remembers the user. The command is required to take advantage of the bot's functions

3. `/unsubscribe`: Removes a user

4. `/create`: Creates a meeting template

5. `/add_address [address]`: Adds an address to the meeting template. Replace `[address]` with the required address

6. `/add_date [date]`: Adds space to the meeting template. Replace `[date]` with the required day

7. `/add_time [time]`: Adds time to the meeting template. Replace `[time]` with the required time

8. `/add_description [description]`: Adds a description of your meeting. Replace `[description]` with the required description

9. `/invite [person_vk_id], [person_vk_id]`: Adds a user who will receive a notification about the meeting. Instead of `[person_vk_id]`, you need to specify the user id (to invite multiple users, specify their id separated by commas). You use it when you access the user via the @ icon in conversations (ex: id1, vladislav0art, etc.)

10. `/delete [person_vk_id], [person_vk_id]`: Removes the user whose id is specified instead of `[person_vk_id]`, if he was previously added (to remove multiple users, specify their id separated by commas)

11. `/add_weather [city] [time]`: Adds weather depending on the selected day (you can find out the weather no more than 10 days in advance)
    Data input format:
    
      `[city]` - city, in English (for example: Krasnodar, Moscow)

      `[time]` - time, you must specify in the following format: `yyyy-mm-dd` `hh:mm` (for example: 2021-07-15 01:00). If you do not specify the time, the average temperature of the day will be displayed
      

12. `/discard`: Deletes the current appointment template

13. `/status`: Shows all information about the current appointment template

14. `/send`: Sends a message to everyone you have indicated through the `/invite` command`
