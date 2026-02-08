import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styled, { useTheme } from 'styled-components';
import { useFinance } from '../../contexts/FinanceContext';

const Container = styled.div`
  width: 95%;
  max-width: 1120px;
  margin: 20px auto 60px;
  background-color: ${props => props.theme.colors.bgElevated};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.lg};
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: ${props => props.theme.shadows.md};
  
  @media (max-width: 750px) {
    padding: 20px;
  }
`;

const Title = styled.h2`
  margin-bottom: 30px;
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.display};
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.5rem;
  
  @media (max-width: 750px) {
    font-size: 1.2rem;
  }
`;

const Chart = () => {
    const { income, expense } = useFinance();
    const theme = useTheme();
    
    const data = [
        { name: 'Entradas', value: Number(income) },
        { name: 'Saídas', value: Number(expense) },
    ];

    const COLORS = [theme.colors.success, theme.colors.error];

    if (Number(income) === 0 && Number(expense) === 0) {
        return null;
    }

    return (
        <Container>
            <Title>Distribuição Financeira</Title>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            fill="#8884d8"
                            paddingAngle={8}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: theme.colors.bgElevated, 
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.radius.md,
                                color: theme.colors.text
                            }} 
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Container>
    );
};

export default Chart;
