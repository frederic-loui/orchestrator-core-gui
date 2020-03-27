/*
 * Copyright 2019 SURF.
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

import "./ContactPersons.scss";

import I18n from "i18n-js";
import PropTypes from "prop-types";
import React from "react";

import { contacts } from "../api";
import { capitalizeFirstLetter, isEmpty, stop } from "../utils/Utils";
import Autocomplete from "./Autocomplete";

export default class ContactPersons extends React.PureComponent {
    constructor(props, context) {
        super(props, context);
        this.state = {
            displayAutocomplete: {},
            filteredSuggestions: [],
            selectedItem: -1,
            contactPersons: []
        };
    }

    componentDidMount = (organisationId = this.props.organisationId) => {
        if (organisationId) {
            contacts(organisationId).then(result => this.setState({ contactPersons: result }));
        }
    };

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.organisationId && nextProps.organisationId !== this.props.organisationId) {
            this.componentDidMount(nextProps.organisationId);
        } else if (isEmpty(nextProps.organisationId) && !isEmpty(this.props.organisationId)) {
            this.props.onChange([{ email: "", name: "", phone: "" }]);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.persons.length + 1 === this.props.persons.length) {
            this.lastPersonInput.focus();
        }
    }

    onChangeInternal = (name, index) => e => {
        const persons = [...this.props.persons];
        const value = e.target.value;
        persons[index][name] = value;
        this.props.onChange(persons);

        if (name !== "name") {
            this.setState({ displayAutocomplete: {}, selectedItem: -1 });
        } else {
            const suggestions = this.state.contactPersons;
            const filteredSuggestions = isEmpty(value)
                ? []
                : suggestions
                      .filter(item => item.name.toLowerCase().indexOf(value.toLowerCase()) > -1)
                      .filter(item => !persons.some(person => person.email === item.email));
            const newDisplayAutoCompleteState = {};
            newDisplayAutoCompleteState[index] = !isEmpty(filteredSuggestions);
            this.setState({
                displayAutocomplete: newDisplayAutoCompleteState,
                filteredSuggestions: filteredSuggestions,
                selectedItem: -1
            });
        }
    };

    addPerson = () => {
        const persons = [...this.props.persons];
        persons.push({ email: "", name: "", phone: "" });
        this.props.onChange(persons);
    };

    removePerson = index => e => {
        stop(e);
        if (index > 0) {
            const persons = [...this.props.persons];
            persons.splice(index, 1);
            this.props.onChange(persons);
        }
    };

    itemSelected = (item, personIndex) => {
        const persons = [...this.props.persons];
        persons[personIndex].name = item.name || "";
        persons[personIndex].email = item.email || "";
        persons[personIndex].phone = item.phone || "";
        this.props.onChange(persons);
        this.setState({ displayAutocomplete: {}, selectedItem: -1 });
    };

    onAutocompleteKeyDown = personIndex => e => {
        const { selectedItem, filteredSuggestions } = this.state;
        if (isEmpty(filteredSuggestions)) {
            return;
        }
        if (e.keyCode === 40 && selectedItem < filteredSuggestions.length - 1) {
            //keyDown
            stop(e);
            this.setState({ selectedItem: selectedItem + 1 });
        }
        if (e.keyCode === 38 && selectedItem >= 0) {
            //keyUp
            stop(e);
            this.setState({ selectedItem: selectedItem - 1 });
        }
        if (e.keyCode === 13) {
            //enter
            if (selectedItem >= 0) {
                stop(e);
                this.itemSelected(filteredSuggestions[selectedItem], personIndex);
            }
        }
        if (e.keyCode === 27) {
            //escape
            stop(e);
            this.setState({ selectedPerson: -1, displayAutocomplete: {} });
        }
    };

    onBlurAutoComplete = e => {
        stop(e);
        setTimeout(() => this.setState({ displayAutocomplete: {} }), 350);
    };

    renderPerson = (total, person, index, errors, displayAutocomplete, filteredSuggestions, selectedItem) => {
        const displayAutocompleteInstance = displayAutocomplete[index];

        let fieldError = errors.filter(error => error.loc[1] === index && error.loc.length === 3);
        fieldError = fieldError.length > 0 ? capitalizeFirstLetter(fieldError[0].msg) : undefined;

        return (
            <section className={`person row${index}`} key={index}>
                <div className="wrapper autocomplete-container name" tabIndex="1" onBlur={this.onBlurAutoComplete}>
                    {index === 0 && <label>{I18n.t("contact_persons.name")}</label>}
                    <input
                        ref={ref => {
                            if (displayAutocompleteInstance) {
                                this.personInput = ref;
                            } else if (total - 1 === index) {
                                this.lastPersonInput = ref;
                            }
                        }}
                        type="text"
                        onChange={this.onChangeInternal("name", index)}
                        value={person.name || ""}
                        onKeyDown={this.onAutocompleteKeyDown(index)}
                        placeholder={I18n.t("contact_persons.namePlaceholder")}
                    />

                    {displayAutocompleteInstance && (
                        <Autocomplete
                            query={person.name}
                            className={index === 0 ? "" : "child"}
                            itemSelected={this.itemSelected}
                            selectedItem={selectedItem}
                            suggestions={filteredSuggestions}
                            personIndex={index}
                        />
                    )}
                </div>
                <div className="wrapper email">
                    {index === 0 && <label>{I18n.t("contact_persons.email")}</label>}
                    <input type="email" onChange={this.onChangeInternal("email", index)} value={person.email || ""} />
                    {fieldError && <em className="error backend-validation">{fieldError}</em>}
                </div>
                <div className="wrapper phone">
                    {index === 0 && <label>{I18n.t("contact_persons.phone")}</label>}
                    <div className="tel">
                        <input type="tel" onChange={this.onChangeInternal("phone", index)} value={person.phone || ""} />
                        <i
                            className={`fa fa-minus ${index === 0 ? "disabled" : ""}`}
                            onClick={this.removePerson(index)}
                        />
                    </div>
                </div>
            </section>
        );
    };

    render() {
        const { persons, errors } = this.props;
        const { displayAutocomplete, selectedItem, filteredSuggestions } = this.state;
        const rootFieldErrors = errors.filter(error => error.loc.length === 1);

        return (
            <section className="contact-persons">
                {persons.map((person, index) =>
                    this.renderPerson(
                        persons.length,
                        person,
                        index,
                        errors,
                        displayAutocomplete,
                        filteredSuggestions,
                        selectedItem
                    )
                )}
                {rootFieldErrors && (
                    <em className="error root-error">
                        {rootFieldErrors.map((e, index) => (
                            <div key={index} className="backend-validation">
                                {capitalizeFirstLetter(e.msg)}
                            </div>
                        ))}
                    </em>
                )}
                <div className="add-person">
                    <i className="fa fa-plus" onClick={this.addPerson} />
                </div>
            </section>
        );
    }
}
ContactPersons.defaultProps = {
    errors: []
};

ContactPersons.propTypes = {
    persons: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    organisationId: PropTypes.string,
    errors: PropTypes.array
};
