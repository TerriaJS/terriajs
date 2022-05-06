import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ViewState from "../../ReactViewModels/ViewState";
import Styles from "./explorer-window.scss";

let animationId = 0;

const SLIDE_DURATION = 300;

interface IProps {
  isVisible?: boolean;
  onClose: () => void;
  viewState: ViewState;
  onStartAnimatingIn?: () => void;
  onDoneAnimatingIn?: () => void;
  children: React.ReactNode;
  isTopElement?: boolean;
}

const ModalPopup: React.FC<IProps> = props => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [slidIn, setSlidIn] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function slideIn(id: number) {
    props.onStartAnimatingIn?.();
    setVisible(true);
    animationTimeout.current = setTimeout(() => {
      console.log(`Finished animating slide in for ${id}`);
      setSlidIn(true);
      setTimeout(() => {
        props.onDoneAnimatingIn?.();
      }, SLIDE_DURATION);
    });
  }

  function slideOut(id: number) {
    setSlidIn(false);
    animationTimeout.current = setTimeout(() => {
      console.log(`Setting visible to false from ${id}`);
      setVisible(false);
    }, SLIDE_DURATION);
  }

  useEffect(() => {
    console.log(
      `Reacting to visibility change ${animationId}. isVisible = ${props.isVisible}`
    );
    // Clear previous timeout. Because of the pattern of state setting
    //  in slideIn and slideOut there is no state that needs to be corrected
    if (animationTimeout.current !== null) {
      clearTimeout(animationTimeout.current);
    }
    if (props.isVisible) {
      slideIn(animationId++);
    } else {
      slideOut(animationId++);
    }
  }, [props.isVisible]);

  useEffect(() => {
    const escKeyListener = (e: KeyboardEvent) => {
      // Only explicitly check share modal state, move to levels/"layers of modals" logic if we need to go any deeper
      if (e.key === "Escape" && !props.viewState.shareModalIsVisible) {
        props.onClose();
      }
    };
    window.addEventListener("keydown", escKeyListener, true);
  });

  return visible ? (
    <div
      className={classNames(
        Styles.modalWrapper,
        props.isTopElement ? "top-element" : ""
      )}
      id="explorer-panel-wrapper"
      aria-hidden={!props.isVisible}
    >
      <div
        onClick={props.onClose}
        id="modal-overlay"
        className={Styles.modalOverlay}
        tabIndex={-1}
      />
      <div
        id="explorer-panel"
        className={classNames(Styles.explorerPanel, {
          [Styles.isMounted]: slidIn
        })}
        aria-labelledby="modalTitle"
        aria-describedby="modalDescription"
        role="dialog"
      >
        <button
          type="button"
          onClick={props.onClose}
          className={Styles.btnCloseModal}
          title={t("addData.closeDataPanel")}
          data-target="close-modal"
        >
          {t("addData.done")}
        </button>
        {props.children}
      </div>
    </div>
  ) : null;
};

export default ModalPopup;
