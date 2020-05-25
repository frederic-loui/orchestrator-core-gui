import "./DropDownContainer.scss";

import React, { useState } from "react";

function DropDownContainer({
    title,
    renderButtonContent,
    renderContent
}: {
    title: string;
    renderButtonContent: (active: boolean, hover: boolean) => React.ReactNode;
    renderContent: (disabled: boolean) => React.ReactNode;
}) {
    const [active, setActive] = useState(false);
    const [hover, setHover] = useState(false);

    return (
        <div className={"dropdown-container"}>
            <button
                className={"dropdown-button"}
                onClick={e => {
                    e.stopPropagation();
                    if (active) {
                        setActive(false);
                        setHover(false);
                    } else {
                        setActive(true);
                    }
                }}
            >
                {renderButtonContent(active, hover)}
            </button>
            <div
                className={active ? "dropdown open" : hover ? "dropdown open" : "dropdown"}
                onClick={e => {
                    e.stopPropagation();
                    if (!active) {
                        setActive(true);
                    }
                }}
            >
                {(active || hover) && renderContent(!active)}
            </div>
        </div>
    );
}

export default DropDownContainer;