/*
 * Copyright 2019-2022 SURF.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import "components/tables/Paginator.scss";

import {
    EuiButtonEmpty,
    EuiContextMenuItem,
    EuiContextMenuPanel,
    EuiFlexGroup,
    EuiFlexItem,
    EuiPagination,
    EuiPopover,
} from "@elastic/eui";
import React, { useState } from "react";

interface IPaginatorProps {
    canNextPage: boolean;
    canPreviousPage: boolean;
    gotoPage: (arg: number) => void;
    nextPage: () => void;
    pageIndex: number;
    pageOptions: number[];
    pageSize: number;
    previousPage: () => void;
    setPageSize: (arg: number) => void;
}

function Paginator({
    canNextPage,
    canPreviousPage,
    gotoPage,
    nextPage,
    pageIndex,
    pageOptions,
    pageSize,
    previousPage,
    setPageSize,
}: IPaginatorProps) {
    // page switchint
    const switchPage = (pageNumber: number) => {
        gotoPage(pageNumber);
    };

    // popover
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const onButtonClick = () => setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen);
    const closePopover = () => setIsPopoverOpen(false);
    const getIconType = (size: number) => {
        return size === pageSize ? "check" : "empty";
    };

    const button = (
        <EuiButtonEmpty size="s" color="text" iconType="arrowDown" iconSide="right" onClick={onButtonClick}>
            Rows per page: {pageSize}
        </EuiButtonEmpty>
    );
    const items = [5, 10, 25, 50, 100].map((newSize) => (
        <EuiContextMenuItem
            key={`${newSize}_rows`}
            icon={getIconType(newSize)}
            onClick={() => {
                closePopover();
                setPageSize(newSize);
            }}
        >
            {newSize}
        </EuiContextMenuItem>
    ));

    return (
        <EuiFlexGroup className="paginator">
            <EuiFlexItem grow={10} className="paginator-center">
                <EuiFlexGroup justifyContent="spaceAround">
                    <EuiFlexItem grow={false}>
                        <EuiFlexGroup>
                            <EuiFlexItem>
                                <EuiPagination
                                    aria-label="pagination"
                                    pageCount={pageOptions.length}
                                    activePage={pageIndex}
                                    onPageClick={(activePage) => switchPage(activePage)}
                                />
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiPopover
                                    button={button}
                                    isOpen={isPopoverOpen}
                                    closePopover={closePopover}
                                    panelPaddingSize="none"
                                >
                                    <EuiContextMenuPanel items={items} />
                                </EuiPopover>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiFlexItem>
        </EuiFlexGroup>
    );
}

export default Paginator;
