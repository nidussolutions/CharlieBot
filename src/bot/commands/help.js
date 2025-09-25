import { sendMessage } from "../../telegram.js";

export function sendPlain(chatId, text, opts = {}) {
  return sendMessage(chatId, text, { ...opts });
}

export default function helpCommand({ chatId }) {
  const message =
    `Olá! Eu sou o Charlie, seu assistente virtual. \n` +
    `Aqui estão alguns comandos que você pode usar:\n\n` +
    `/help - Mostra esta mensagem de ajuda.\n` +
    `/config nome=Seu Nome email=seu@email.com \n` +
    `/profile - Mostra suas configurações atuais.\n\n` +
    `Sinta-se à vontade para me enviar qualquer pergunta ou solicitar assistência!`;
  sendPlain(chatId, message);
};
