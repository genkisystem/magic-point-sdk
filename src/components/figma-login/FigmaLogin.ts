import { FigmaClient, OAuthClient, OAuthConfig } from "@services";
import { createDivElement } from "@utils";
import {
    GetTeamProjectsResult,
    GetUserMeResult,
} from "figma-api/lib/api-types";
import i18next from "i18next";
import { ButtonComponent, IButtonConfig } from "../button/ButtonComponent";
import { Component, SelectItem } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";

type ExtendedGetTeamProjectsResult = GetTeamProjectsResult & { name: string };

export class FigmaLoginBody implements Component {
    private componentElement: HTMLElement;
    private oAuthClient: OAuthClient;

    private readonly oAuthConfig: OAuthConfig = {
        authorizationUrl: "https://www.figma.com/oauth",
        clientId: "fQajLA73u5Megnj2UIfugu",
        redirectUri: "http://localhost:8080/api/figma/oauth-callback",
        scope: "files:read",
    };

    private teamId: string = "";
    private teams: Map<string, ExtendedGetTeamProjectsResult> = new Map();
    private teamOptions: SelectItem[] = [];

    constructor(
        private figmaClient: FigmaClient,
        private updateFooter: (configs: FooterButtonConfigs) => void,
        private showLoading: () => void,
        private hideLoading: () => void,
        private teamIds: string[],
    ) {
        this.componentElement = createDivElement({
            className: "login-container",
        });

        this.oAuthClient = new OAuthClient(this.oAuthConfig);

        this.renderComponent();
    }

    private createFlexContainer() {
        const container = createDivElement({ className: "info-row" });
        return container;
    }

    private createUserImage(userInfo: GetUserMeResult) {
        const image = document.createElement("img");
        image.src = userInfo.img_url;
        image.className = "user-image";
        return image;
    }

    // private createUserInfoText(userInfo: GetUserMeResult) {
    //     const userInfoText = createDivElement({ className: "user-info-text" });
    //     userInfoText.innerHTML = `<p>${i18next.t(
    //         "figma:login.userInfoText.name",
    //     )}: ${userInfo.handle}</p><p>${i18next.t(
    //         "figma:login.userInfoText.email",
    //     )}: ${userInfo.email}</p>`;
    //     return userInfoText;
    // }

    private createUserInfoText(userInfo: GetUserMeResult) {
        const userInfoText = createDivElement({ className: "user-info-text" });
        userInfoText.innerHTML = `<p><strong>${i18next.t(
            "figma:login.userInfoText.name",
        )}:</strong> ${userInfo.handle}</p><p><strong>${i18next.t(
            "figma:login.userInfoText.email",
        )}:</strong> ${userInfo.email}</p>`;
        return userInfoText;
    }

    private displayUserInfo(userInfo: GetUserMeResult): HTMLElement {
        const flexContainer = this.createFlexContainer();
        const userInfoRow = createDivElement({ className: "user-info-row" });

        const userImage = this.createUserImage(userInfo);
        const userInfoText = this.createUserInfoText(userInfo);

        userInfoRow.append(userImage, userInfoText);
        flexContainer.appendChild(userInfoRow);

        return flexContainer;
    }

    private createLinkButton() {
        const linkButtonConfig: IButtonConfig = {
            text: i18next.t("figma:login.linkButtonText"),
            variant: "outlined",
            color: "primary",
            onClick: () => this.onLinkClick(),
        };
        const linkButton = new ButtonComponent(linkButtonConfig);
        return linkButton.render();
    }

    private onLinkClick() {
        this.oAuthClient.initiateOAuthFlow();
        this.listenForToken();
    }

    private listenForToken(): void {
        const tokenListener = async (event: MessageEvent) => {
            if (event.origin !== "http://localhost:8080") {
                return;
            }

            const { figma_token } = event.data;
            if (figma_token) {
                try {
                    this.showLoading();
                    this.figmaClient.setToken(figma_token);
                    this.teams = await this.figmaClient.fetchFigmaTeams(
                        this.teamIds,
                    );

                    this.teamOptions = Array.from(this.teams.entries()).map(
                        ([id, response]) => ({
                            display: response.name,
                            value: id,
                        }),
                    );

                    this.figmaClient.fetchFigmaInformation(
                        this.updateScreen.bind(this),
                    );
                } catch (error) {
                    console.error("Error fetching Figma information:", error);
                    this.showError(error);
                } finally {
                    window.removeEventListener("message", tokenListener);
                }
            }
        };

        window.addEventListener("message", tokenListener);
    }

    private showError(error: any): void {
        this.hideLoading();

        const errorMessage = document.createElement("p");
        errorMessage.textContent = `${i18next.t("figma:login.error.prefix")}: ${
            error.message || i18next.t("figma:login.error.content")
        }`;
        errorMessage.style.color = "red";
        this.componentElement.appendChild(errorMessage);
    }

    private updateScreen() {
        this.hideLoading();
        this.renderComponent();
    }

    private addTeamSelectionElements(): void {
        const teamSelectBox = document.createElement("select");
        teamSelectBox.className = "team-select";

        // Default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = i18next.t(
            "figma:login.defaultSelectOption",
        );
        teamSelectBox.appendChild(defaultOption);

        // Adding options from teamOptions
        this.teamOptions.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.value;
            option.textContent = item.display;
            teamSelectBox.appendChild(option);
        });

        teamSelectBox.addEventListener("change", (event: Event) => {
            const target = event.target as HTMLSelectElement;
            this.teamId = target.value;

            this.updateFooter({
                nextButtonConfig: {
                    disabled: target.value ? false : true,
                    preClick: this.preClickFetchTeamInfo.bind(this),
                },
            });
        });

        this.componentElement.appendChild(teamSelectBox);
    }

    private async preClickFetchTeamInfo(): Promise<boolean | Error> {
        if (this.teamId) {
            try {
                this.showLoading();
                const team = this.teams.get(this.teamId);
                if (team) {
                    await this.figmaClient.fetchFigmaFiles(team);
                }
                return true;
            } catch (error) {
                console.error("Error fetching Figma team information:", error);
                this.showError(error);
                return new Error(i18next.t("figma:login.fetchTeamFailedMsg"));
            } finally {
                this.hideLoading();
                this.updateFooter({
                    nextButtonConfig: {
                        preClick: undefined,
                    },
                });
            }
        }
        return false;
    }

    renderComponent() {
        this.componentElement.innerHTML = "";

        const user = this.figmaClient.getUserInfo();
        if (!user) {
            const button = this.createLinkButton();
            this.componentElement.appendChild(button);
            return;
        }

        const userInfoDisplay = this.displayUserInfo(user);
        this.componentElement.appendChild(userInfoDisplay);
        this.addTeamSelectionElements();
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}
