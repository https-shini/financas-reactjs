import React from "react";
import ResumeItem from "../ResumeItem";
import * as C from "./styles";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet 
} from "lucide-react";
import { useFinance } from "../../contexts/FinanceContext";
import { motion } from "framer-motion";

const Resume = () => {
  const { income, expense, total } = useFinance();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <C.Container
      as={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <ResumeItem
          title="Entradas"
          Icon={ArrowUpCircle}
          value={income}
          color="#22c55e"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <ResumeItem
          title="Saídas"
          Icon={ArrowDownCircle}
          value={expense}
          color="#dc2626"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <ResumeItem 
          title="Total" 
          Icon={Wallet} 
          value={total} 
          color={Number(total) >= 0 ? "#3b82f6" : "#dc2626"}
        />
      </motion.div>
    </C.Container>
  );
};

export default Resume;
