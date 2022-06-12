import React from "react";
import { Button, Modal } from "rsuite";

const ModalSuccess = ({
  txHash = "",
  link = "#",
  isOpen = false,
  setIsOpen,
}) => {
  const handleClose = () => setIsOpen(false);
  return (
    <div className="modal-container">
      <Modal open={isOpen} onClose={handleClose}>
        <Modal.Header>
          <Modal.Title>NFT is minting...</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>TX hash: {txHash}</p>
          <p>
            Success transaction{" "}
            <a rel="noopener noreferrer" href={link} target="_blank">
              check it on etherscan
            </a>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} appearance="primary">
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModalSuccess;
