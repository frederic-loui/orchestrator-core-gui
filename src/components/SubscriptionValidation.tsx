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

import "components/SubscriptionValidation.scss";

import CheckBox from "components/CheckBox";
import ConfirmationDialog from "components/modals/ConfirmationDialog";
import React from "react";
import { FormattedMessage, WrappedComponentProps, injectIntl } from "react-intl";
import ApplicationContext from "utils/ApplicationContext";
import { setFlash } from "utils/Flash";
import { enrichSubscription, renderDate } from "utils/Lookups";
import { SortOption, Subscription, SubscriptionWithDetails } from "utils/types";
import { stop } from "utils/Utils";

type Column =
    | "customer_name"
    | "description"
    | "insync"
    | "product_name"
    | "status"
    | "start_date_epoch"
    | "end_date_epoch";

interface IProps extends WrappedComponentProps {
    subscriptions: Subscription[];
    workflow: string;
    onChange: () => void;
}

interface IState {
    sorted: SortOption;
    subscriptions?: SubscriptionWithDetails[];
    confirmationDialogOpen: boolean;
    confirmationDialogAction: () => void;
    confirm: () => void;
    confirmationDialogQuestion: string;
}

class SubscriptionValidation extends React.Component<IProps, IState> {
    state: IState = {
        sorted: { name: "status", descending: false },
        confirmationDialogOpen: false,
        confirmationDialogAction: () => this,
        confirm: () => this,
        confirmationDialogQuestion: "",
    };

    componentDidUpdate(prevProps: IProps) {
        const { subscriptions } = this.props;
        if (subscriptions && subscriptions.length !== prevProps.subscriptions.length) {
            const { organisations, products } = this.context;
            this.setState({
                subscriptions: this.props.subscriptions.map((subscription) =>
                    enrichSubscription(subscription, organisations, products)
                ),
            });
        }
    }

    sortBy = (name: Column) => (a: SubscriptionWithDetails, b: SubscriptionWithDetails) => {
        if (name === "product_name") {
            return a.product.name.toLowerCase().localeCompare((b.product.name as string).toLowerCase());
        }
        const aSafe = a[name];
        const bSafe = b[name];
        return typeof aSafe === "string"
            ? aSafe.toLowerCase().localeCompare((bSafe as string).toLowerCase())
            : (aSafe as number) - (bSafe as number);
    };

    sort = (name: Column) => (e: React.MouseEvent<HTMLTableHeaderCellElement>) => {
        stop(e);
        const sorted = { ...this.state.sorted };
        const subscriptions = [...(this.state.subscriptions ?? [])].sort(this.sortBy(name));

        sorted.descending = sorted.name === name ? !sorted.descending : false;
        sorted.name = name;
        this.setState({
            subscriptions: sorted.descending ? subscriptions.reverse() : subscriptions,
            sorted: sorted,
        });
    };

    sortColumnIcon = (name: Column, sorted: SortOption) => {
        if (sorted.name === name) {
            return <i className={sorted.descending ? "fas fa-sort-down" : "fas fa-sort-up"} />;
        }
        return <i />;
    };

    cancelConfirmation = () => this.setState({ confirmationDialogOpen: false });

    confirmation = (question: string, action: () => void) =>
        this.setState({
            confirmationDialogOpen: true,
            confirmationDialogQuestion: question,
            confirmationDialogAction: () => {
                this.cancelConfirmation();
                action();
            },
        });

    handleDeleteSubscription = (subscription: SubscriptionWithDetails) => (e: React.MouseEvent<HTMLElement>) => {
        stop(e);
        const { intl } = this.props;
        this.confirmation(
            intl.formatMessage(
                { id: "subscriptions.deleteConfirmation" },
                {
                    name: subscription.product.name,
                    customer: subscription.customer_name,
                }
            ),
            () =>
                this.context.apiClient.deleteSubscription(subscription.subscription_id).then(() => {
                    this.props.onChange();
                    setFlash(
                        intl.formatMessage({ id: "subscriptions.flash.delete" }, { name: subscription.product.name })
                    );
                })
        );
    };

    renderSubscriptionsTable(subscriptions: SubscriptionWithDetails[], sorted: SortOption) {
        const { intl } = this.props;

        const columns: Column[] = [
            "customer_name",
            "description",
            "insync",
            "product_name",
            "status",
            "start_date_epoch",
            "end_date_epoch",
        ];
        const th = (index: number) => {
            const name = columns[index];
            return (
                <th key={index} className={name} onClick={this.sort(name)}>
                    <span>
                        <FormattedMessage id={`subscriptions.${name}`} />
                    </span>
                    {this.sortColumnIcon(name, sorted)}
                </th>
            );
        };

        if (subscriptions.length !== 0) {
            return (
                <table className="subscriptions">
                    <thead>
                        <tr>
                            {columns.map((column, index) => th(index))}
                            <th className="action">
                                <span>
                                    <FormattedMessage id={"subscriptions.noop"} />
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptions.map((subscription, index) => (
                            <tr key={`${subscription.subscription_id}_${index}`}>
                                <td
                                    data-label={intl.formatMessage({ id: "subscriptions.customer_name" })}
                                    className="customer_name"
                                >
                                    {subscription.customer_name}
                                </td>
                                <td
                                    data-label={intl.formatMessage({ id: "subscriptions.description" })}
                                    className="description"
                                >
                                    <a
                                        href={`subscriptions/${subscription.subscription_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {subscription.description}
                                    </a>
                                </td>
                                <td data-label={intl.formatMessage({ id: "subscriptions.insync" })} className="insync">
                                    <CheckBox value={subscription.insync} name="insync" readOnly={true} />
                                </td>
                                <td
                                    data-label={intl.formatMessage({ id: "subscriptions.product_name" })}
                                    className="product_name"
                                >
                                    {subscription.product.name}
                                </td>
                                <td data-label={intl.formatMessage({ id: "subscriptions.status" })} className="status">
                                    {subscription.status}
                                </td>
                                <td
                                    data-label={intl.formatMessage({ id: "subscriptions.start_date_epoch" })}
                                    className="start_date_epoch"
                                >
                                    {renderDate(subscription.start_date)}
                                </td>
                                <td
                                    data-label={intl.formatMessage({ id: "subscriptions.name" })}
                                    className="end_date_epoch"
                                >
                                    {renderDate(subscription.end_date)}
                                </td>
                                <td data-label={intl.formatMessage({ id: "subscriptions.noop" })} className="actions">
                                    <span>
                                        <i
                                            className="fas fa-trash-alt"
                                            onClick={this.handleDeleteSubscription(subscription)}
                                        />
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        return (
            <div>
                <em>
                    <FormattedMessage id="validations.no_subscriptions" />
                </em>
            </div>
        );
    }

    render() {
        const {
            subscriptions,
            sorted,
            confirmationDialogOpen,
            confirmationDialogAction,
            confirmationDialogQuestion,
        } = this.state;
        const { workflow } = this.props;
        return (
            <section className="subscription-validation">
                <ConfirmationDialog
                    isOpen={confirmationDialogOpen}
                    cancel={this.cancelConfirmation}
                    confirm={confirmationDialogAction}
                    question={confirmationDialogQuestion}
                />
                <h3>
                    <FormattedMessage id="validations.workflow_key" values={{ workflow: workflow }} />
                </h3>
                <section className="subscriptions">
                    {this.renderSubscriptionsTable(subscriptions ?? [], sorted)}
                </section>
            </section>
        );
    }
}

SubscriptionValidation.contextType = ApplicationContext;

export default injectIntl(SubscriptionValidation);
