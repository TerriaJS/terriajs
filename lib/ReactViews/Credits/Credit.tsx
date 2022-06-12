import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLinkIcon } from "../Custom/parseCustomHtmlToReact";
import { ICredit } from "./Credit.type";
import { Spacer } from "./Credits";

export const Credit: FC<{
  credit: ICredit;
  lastElement: boolean;
}> = ({ credit, lastElement }) => {
  const { t } = useTranslation();

  return (
    <>
      <a
        key={credit.url}
        target="_blank"
        rel="noopener noreferrer"
        href={credit.url}
      >
        {t(credit.text)} <ExternalLinkIcon />
      </a>
      {!lastElement ? <Spacer /> : null}
    </>
  );
};
