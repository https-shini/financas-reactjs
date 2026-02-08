import styled from "styled-components";

export const Container = styled.div`
  max-width: 1120px;
  width: 95%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: -60px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    margin-top: -40px;
    gap: 15px;
  }
`;
