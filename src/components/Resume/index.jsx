import ResumeItem from "../ResumeItem";
import * as C from "./styles";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useFinance } from "../../state/contexts";
import { consolidatedBalance, totalsOf } from "../../domain/selectors";
import { formatMoney } from "../../domain/money";

const Resume = () => {
    const { store, today } = useFinance();
    const reduce = useReducedMotion();
    const totals = totalsOf(store.transactions);
    const { cashCents } = consolidatedBalance(store, today);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: reduce ? 0 : 0.08 } } };
    const itemVariants = reduce ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <C.Container as={motion.section} aria-label="Resumo" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
                <ResumeItem title="Entradas" Icon={ArrowUpCircle} value={formatMoney(totals.incomeCents)} color="#16a34a" />
            </motion.div>
            <motion.div variants={itemVariants}>
                <ResumeItem title="Saídas" Icon={ArrowDownCircle} value={formatMoney(totals.expenseCents)} color="#dc2626" />
            </motion.div>
            <motion.div variants={itemVariants}>
                <ResumeItem title="Saldo" Icon={Wallet} value={formatMoney(cashCents)} color={cashCents >= 0 ? "#4f46e5" : "#dc2626"} />
            </motion.div>
        </C.Container>
    );
};

export default Resume;
