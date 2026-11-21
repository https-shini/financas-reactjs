import { cleanText } from "../../domain/transactions";

/**
 * Nome de conta/cartão já usado por outro registro (sem diferenciar maiúsculas/acentuação de espaços).
 * Contas e cartões aparecem juntos nas listas de seleção, então os nomes precisam ser únicos.
 */
export function accountNameTaken(accounts, name, exceptId) {
    const key = cleanText(name).toLocaleLowerCase("pt-BR");
    return Boolean(key) && accounts.some((a) => a.id !== exceptId && cleanText(a.name).toLocaleLowerCase("pt-BR") === key);
}

export const DUPLICATE_ACCOUNT_NAME = "Já existe uma conta ou cartão com este nome.";
