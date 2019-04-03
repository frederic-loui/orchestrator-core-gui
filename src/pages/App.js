import React from "react";
import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";
import "./App.scss";
import ErrorDialog from "../components/ErrorDialog";
import Flash from "../components/Flash";
import ProtectedRoute from "../components/ProtectedRoute";
import NotFound from "../pages/NotFound";
import Help from "../pages/Help";
import Processes from "../pages/Processes";
import OldSubscriptions from "./OldSubscriptions";
import Subscriptions from "./Subscriptions";
import Validations from "../pages/Validations";
import NewProcess from "../pages/NewProcess";
import ProcessDetail from "./ProcessDetail";
import SubscriptionDetail from "./SubscriptionDetail";
import ServerError from "../pages/ServerError";
import NotAllowed from "../pages/NotAllowed";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import {config, locationCodes, me, organisations, products, redirectToAuthorizationServer, reportError} from "../api";
import "../locale/en";
import "../locale/nl";
import {getParameterByName} from "../utils/QueryParameters";
import TerminateSubscription from "./TerminateSubscription";
import MetaData from "./MetaData";
import ProductBlock from "../components/ProductBlock";
import ResourceType from "../components/ResourceType";
import Product from "../components/Product";
import Cache from "./Cache";
import Tasks from "./Tasks";
import NewTask from "./NewTask";
import TaskDetail from "./TaskDetail";
import Prefixes from "../pages/Prefixes";
import { RouterToUrlQuery } from 'react-url-query';

const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);

class App extends React.PureComponent {

    constructor(props, context) {
        super(props, context);
        this.state = {
            loading: true,
            currentUser: {},
            configuration: {},
            organisations: [],
            locationCodes: [],
            products: [],
            error: false,
            errorDialogOpen: false,
            redirectState: "/processes",
            errorDialogAction: () => {
                this.setState({errorDialogOpen: false});
            }
        };
        window.onerror = (msg, url, line, col, err) => {
            if (err && err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem("access_token");
                this.componentDidMount();
                return;
            }
            this.setState({errorDialogOpen: true});
            const info = err || {};
            const response = info.response || {};
            const error = {
                userAgent: navigator.userAgent,
                message: msg,
                url: url,
                line: line,
                col: col,
                error: info.message,
                stack: info.stack,
                targetUrl: response.url,
                status: response.status
            };
            reportError(error);
        };
    }

    handleBackendDown = (err) => {
        const location = window.location;
        const alreadyRetried = location.href.indexOf("guid") > -1;
        if (alreadyRetried) {
            window.location.href = `${location.protocol}//${location.hostname}${location.port ? ":" + location.port : ""}/error`;
        } else {
            //302 redirects from Shib are cached by the browser. We force a one-time reload
            const guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
            window.location.href = `${location.href}?guid=${guid}`;
        }
    };

    componentDidMount() {
        const hash = window.location.hash;
        const accessTokenMatch = hash.match(/access_token=(.*?)&/);
        if (accessTokenMatch) {
            localStorage.setItem("access_token", accessTokenMatch[1]);
            const stateMatch = hash.match(/state=(.*?)&/);
            if (stateMatch) {
                this.setState({redirectState: atob(stateMatch[1])})
            }
            this.fetchUser();
        } else if (window.location.href.indexOf("error") > -1) {
            this.setState({loading: false});
        } else {
            const accessToken = localStorage.getItem("access_token");
            if (!accessToken) {
                config().then(conf => {
                    if (conf.oauthEnabled) {
                        redirectToAuthorizationServer();
                    } else {
                        this.fetchUser();
                    }
                });
                return;
            }
            this.fetchUser();
        }
    }

    fetchUser() {
        config()
            .catch(err => this.handleBackendDown(err))
            .then(configuration => {
                me().then(currentUser => {
                    if (currentUser && (currentUser.sub || currentUser.user_name)) {
                        Promise.all([organisations(), products(), locationCodes()]).then(result => {
                            const [allOrganisations, allProducts, allLocationCodes] = result;
                            this.setState({
                                loading: false,
                                currentUser: currentUser,
                                configuration: configuration,
                                organisations: allOrganisations,
                                locationCodes: allLocationCodes,
                                products: allProducts.sort((a, b) => a.name.localeCompare(b.name))
                            });
                        })
                    } else {
                        this.handleBackendDown();
                    }
                }).catch(err => {
                        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                            localStorage.removeItem("access_token");
                            this.componentDidMount();
                        } else {
                            throw err;
                        }
                    });
            });
    }

    render() {
        const {loading, errorDialogAction, errorDialogOpen} = this.state;

        if (loading) {
            return null; // render null when app is not ready yet for static mySpinner
        }

        const {currentUser, configuration, organisations, products, locationCodes, redirectState} = this.state;

        return (
            <Router>
                <RouterToUrlQuery>
                <div>
                    <div>
                        <Flash/>
                        <Header currentUser={currentUser}/>
                        <Navigation currentUser={currentUser} {...this.props}/>
                        <ErrorDialog isOpen={errorDialogOpen}
                                     close={errorDialogAction}/>
                    </div>
                    <Switch>
                        <Route exact path="/oauth2/callback" render={() => <Redirect to={redirectState}/>}/>
                        <Route exact path="/" render={() => <Redirect to="/processes"/>}/>
                        <ProtectedRoute path="/processes"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <Processes currentUser={currentUser} {...props}
                                                                    products={products}
                                                                    organisations={organisations}/>}/>
                        <ProtectedRoute path="/validations/:type"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <Validations {...props}
                                                                      products={products}
                                                                      organisations={organisations}/>}/>
                        <ProtectedRoute path="/new-process"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <NewProcess currentUser={currentUser}
                                                                     products={products}
                                                                     organisations={organisations}
                                                                     locationCodes={locationCodes}
                                                                     preselectedProduct={getParameterByName("product", props.location.search)}
                                                                     preselectedOrganisation={getParameterByName("organisation", props.location.search)}
                                                                     preselectedDienstafname={getParameterByName("dienstafname", props.location.search)}
                                                                     {...props}
                                        />}/>
                        <ProtectedRoute path="/terminate-subscription"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <TerminateSubscription currentUser={currentUser}
                                                                                products={products}
                                                                                organisations={organisations}
                                                                                subscriptionId={getParameterByName("subscription", props.location.search)}
                                                                                {...props}
                                        />}/>
                        <Route path="/process/:id"
                               render={props => <ProcessDetail currentUser={currentUser}
                                                               organisations={organisations}
                                                               configuration={configuration}
                                                               products={products}
                                                               locationCodes={locationCodes}
                                                               {...props}/>}/>
                        <Route path="/subscriptions"
                               render={props => <Subscriptions organisations={organisations} {...props}/>}/>
                        <Route path="/old-subscriptions"
                               render={props => <OldSubscriptions products={products}
                                                                  organisations={organisations}
                                                                  {...props}/>}/>
                        <Route path="/subscription/:id"
                               render={props => <SubscriptionDetail organisations={organisations}
                                                                    products={products}
                                                                    {...props}/>}/>
                        <ProtectedRoute path="/metadata/:type"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <MetaData {...props} />}/>
                        <ProtectedRoute path="/product/:id"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <Product {...props} />}/>
                        <ProtectedRoute path="/product-block/:id"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <ProductBlock {...props} />}/>
                        <ProtectedRoute path="/resource-type/:id"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <ResourceType {...props} />}/>
                        <ProtectedRoute path="/cache"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <Cache {...props} />}/>
                        <ProtectedRoute path="/tasks"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <Tasks currentUser={currentUser} {...props}/>}/>
                        <ProtectedRoute path="/prefixes"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <Prefixes currentuser={currentUser}
                                                                   organisations={organisations}
								   products={products}
                                                                   {...props} />}/>
                        <ProtectedRoute path="/new-task"
                                        currentUser={currentUser} configuration={configuration}
                                        render={props => <NewTask currentUser={currentUser}
                                                                  products={products}
                                                                  {...props}/>}/>
                        <Route path="/task/:id"
                               render={props => <TaskDetail currentUser={currentUser}
                                                            configuration={configuration}
                                                            products={products}
                                                            {...props}/>}/>
                        <Route path="/help"
                               render={props => <Help currentUser={currentUser} {...props}/>}/>
                        <Route path="/not-allowed"
                               render={props => <NotAllowed {...props}/>}/>
                        <Route path="/error"
                               render={props => <ServerError {...props}/>}/>
                        <Route component={NotFound}/>
                    </Switch>
                </div>
                </RouterToUrlQuery>
            </Router>

        );
    }
}

export default App;
