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

import { ENV } from "env";
import { useAuth } from "oidc-react";
import React, { ReactNode } from "react";
import { Redirect, Route, RouteComponentProps } from "react-router-dom";

export default function ProtectedRoute({
    path,
    render,
}: {
    path: string;
    render: (props: RouteComponentProps<any>) => ReactNode;
}) {
    /**
     * This provides the hook to restrict access based on memberships of the logged in user. For
     * now we will allow everyone access
     */

    const auth = useAuth();

    if (!ENV.OAUTH2_ENABLED || (auth?.userData && !auth?.userData.expired)) {
        return <Route path={path} render={render} />;
    }
    return <Redirect to={"/not-allowed"} />;
}
