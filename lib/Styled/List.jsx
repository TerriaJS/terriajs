import styled from "styled-components";

export const Ul = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const Li = styled.li``;

export const Ol = styled(Ul).attrs({
  as: "ol"
})``;

export default Ul;
