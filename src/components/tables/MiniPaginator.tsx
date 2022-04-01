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

import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import React from "react";

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

function MiniPaginator({
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
    return (
        <EuiFlexGroup className="mini-paginator">
            <EuiFlexItem>
                <EuiButtonIcon
                    onClick={() => gotoPage(0)}
                    color="primary"
                    disabled={!canPreviousPage}
                    iconType="sortLeft"
                    aria-label="sort left"
                />
            </EuiFlexItem>
            <EuiFlexItem>
                <EuiButtonIcon
                    onClick={() => previousPage()}
                    color="primary"
                    disabled={!canPreviousPage}
                    iconType="arrowLeft"
                    aria-label="arrow left"
                />
            </EuiFlexItem>
            <EuiFlexItem>
                <EuiButtonIcon
                    onClick={() => nextPage()}
                    color="primary"
                    disabled={!canNextPage}
                    iconType="arrowRight"
                    aria-label="arrow right"
                />
            </EuiFlexItem>
            <EuiFlexItem>
                <EuiButtonIcon
                    onClick={() => gotoPage(pageOptions.length - 1)}
                    color="primary"
                    disabled={!canNextPage}
                    iconType="sortRight"
                    aria-label="sort right"
                />
            </EuiFlexItem>
        </EuiFlexGroup>
    );
}

export default MiniPaginator;
