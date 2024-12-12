import { useState } from "react";
import { Modal, Button, ConfigProvider } from "antd";
import { QRCodeCanvas } from "qrcode.react";
import { QrCodeIcon } from "lucide-react";

const QRCodeModal = ({ tripId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const inviteUrl = `${process.env.NEXT_PUBLIC_FRONTEND_HOST}/trips/join/${tripId}`;

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                type="link"
                icon={<QrCodeIcon size={16} />}
                onClick={showModal}
                size="small"
                className="text-black"
            >
                <p className="text-xs">QR Code</p>
            </Button>

            <Modal
                title="Share Trip Invite"
                open={isModalOpen}
                onCancel={handleClose}
                footer={[
                    <Button key="close" onClick={handleClose}>
                        Close
                    </Button>,
                ]}
                width={320}
            >
                <div className="flex flex-col items-center justify-center p-4">
                    <QRCodeCanvas
                        value={inviteUrl}
                        size={256}
                        level="H"
                        includeMargin
                        className="mb-4"
                    />
                    <p className="text-sm text-gray-600 text-center">
                        Scan this QR code to join the trip
                    </p>
                </div>
            </Modal>
        </>
    );
};

export default QRCodeModal;
