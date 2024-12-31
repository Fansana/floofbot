module.exports =
{
    handleModal: async function (bot, interaction)
    {
        let modalData = interaction.customId.split(":");
        let voteId = modalData[0];
        let responseId = modalData[1];

        bot.data.votes = bot.data.votes || {};
        bot.data.votes[voteId] = bot.data.votes[voteId] || {};
        bot.data.votes[voteId].responses = bot.data.votes[voteId].responses || {};
        bot.data.votes[voteId].responses[responseId] = bot.data.votes[voteId].responses[responseId];

        if (bot.data.votes[voteId].responses[responseId] == null)
            return;

        bot.data.votes[voteId].responses[responseId].reason = interaction.fields.getTextInputValue('reasonInput');
        await interaction.reply({ content: 'Your vote was received successfully!', ephemeral: true });
    }
};