import { sendMessage } from "../../telegram.js";

export function sendPlain(chatId, text, opts = {}) {
  return sendMessage(chatId, text, { ...opts });
}

export default function helpCommand({ chatId }) {
  const message =
    `Olá! Eu sou o Charlie, seu assistente virtual. \n` +
    `Aqui estão alguns comandos que você pode usar:\n\n` +
    `/config - configura seus dados locais \n` +
    `/linkgoogle - vincula sua conta Google.\n` +
    `/help - Mostra esta mensagem de ajuda.\n` +
    `\nSinta-se à vontade para me enviar qualquer pergunta ou solicitar assistência!`;
  sendPlain(chatId, message);
};
