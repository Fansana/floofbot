const { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, Events, ModalBuilder, EmbedBuilder } = require('discord.js');
var fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const { isAsyncFunction } = require('util/types');

client.data = {};

var admin = "124136556578603009";

const commands = require("./commands.js");
const buttons = require("./buttons.js");
const modalHandler = require("./modals.js");

const auth = require("./auth.json");

const rest = new REST({ version: '10' }).setToken(auth.token);

(async () =>
{
    try
    {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(auth.id), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error)
    {
        console.error(error);
    }
})();

client.on('ready', () =>
{
    console.log(`Logged in as ${client.user.tag}!`);

    loadData(function (newData)
    {
        client.data = newData;
        delete client.data[null];
        console.log("DATA LOADED", client.data);
    });
});

function loadData (complete)
{
    fs.readFile('./botData.json', function read (err, data) 
    {
        if (err) 
        {
            data = "{}";
            console.log("no data found");
        }

        try
        {
            client.data = JSON.parse(data);
            console.log("savedata loaded:", data);
        }
        catch (e)
        {
            if (data == null)
            {
                console.log("Memory broken, will attempt to restore backup.");
            }
        }

        if (data == null || data == {})
        {
            fs.readFile('./botDataBackup.json', function read (err, data)
            {
                if (err)
                {
                    data = "{}";

                    console.log("no data found in backup either");
                }

                try
                {
                    client.data = JSON.parse(data);
                    console.log("Backup restored");
                }
                catch (e)
                {
                    if (data == null)
                    {
                        client.data = {};
                        console.log("Memory backup broken, making new");
                        saveBackup = false;
                    }
                }
                initialized = true;
            });
        }
        else //successfully loaded
        {
            client.saveBackup(true);

            initialized = true;
        }

        client.data = client.data || {};

        client.data.servers = client.data.servers || {};

        complete(client.data);
    });
}

client.saveBackup = function (silent = false)
{
    console.log("Writing Backup");
    fs.writeFile("./botDataBackup.json", JSON.stringify(client.data), function (err)
    {
        if (err)
        {
            console.log(err);
        }
    });
};

saveData = function ()
{
    newData = client.data || {};
    let json = JSON.stringify(newData);
    console.log("Saving...", newData, json);
    try
    {
        fs.writeFileSync("./botData.json", json);
    }
    catch (ex)
    {
        console.log("Error while saving!");
        console.log(ex);
    }
};

function shuffleArray (array)
{
    for (let i = array.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function GetUserById (guild, userId)
{
    let user = await client.users.cache.get(userId);

    if (!user)
    {
        user = await client.users.fetch(userId);
    }

    return user;
}

async function TryExecuteCommand (command, interaction, extraData = null)
{
    if (command.admin)
    {
        let admins = client.data.servers[interaction.guildId].admins || [];

        let isServerAdmin = false;
        let isBotAdmin = admins.indexOf(interaction.user.id) >= 0;
        let isHardcodedAdmin = interaction.user.id == admin;
        let isOwner = false;

        if (interaction.member.guild)
        {
            isServerAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
            isOwner = interaction.member.guild.ownerId == interaction.user.id;
        }

        let forbidden = (!isBotAdmin && !isHardcodedAdmin && !isServerAdmin && !isOwner);

        console.log(forbidden);

        if (forbidden)
        {
            console.log("blocked");
            interaction.reply({ content: "You do not have permission to perform this action.", ephemeral: true });
            return;
        }
    }

    console.log("Current Data:", client.data);
    if (isAsyncFunction(command.execute))
        await command.execute(client, interaction, extraData);
    else
        command.execute(client, interaction, extraData);

    saveData();
}

client.on('interactionCreate', async function (interaction)
{
    if (interaction.guildId === null)
    {
        interaction.reply("You cannot use me in DM's.");
        return;
    }

    client.data.servers = client.data.servers || {};
    client.data.servers[interaction.guildId] = client.data.servers[interaction.guildId] || {};
    client.data.servers[interaction.guildId].admins = client.data.servers[interaction.guildId].admins || [];

    if (interaction.isChatInputCommand())
    {
        for (let i = 0; i < commands.length; i++)
        {
            if (commands[i].name === interaction.commandName)
            {
                TryExecuteCommand(commands[i], interaction);
                return;
            }
        }
    }
    else if (interaction.isButton())
    {
        for (let i = 0; i < buttons.length; i++)
        {
            let buttonData = interaction.customId.split(":");
            if (buttons[i].name === buttonData[0])
            {
                TryExecuteCommand(buttons[i], interaction, buttonData[1]);
                return;
            }
        }
    }
    else if (interaction.isModalSubmit())
    {
        modalHandler.handleModal(client, interaction);
    }

    saveData();
});

client.sendMessage = function (opts, callback)
{
    try
    {
        client.channels.resolve(opts.to).send(opts.message).then(msg =>
        {
            callback && callback(msg.url, { id: msg.id, message: msg });
        });
    }
    catch (e)
    {
        console.log("Error sending message: ", e);
    }
};

client.login(auth.token);