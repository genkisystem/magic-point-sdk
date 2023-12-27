import { FigmaClient } from "../../figma/figma";
import { FigmaTeamProjectResponse, FigmaUser } from "../../figma/type";
import { ButtonComponent, IButtonConfig } from "../Button/ButtonComponent";
import { Component, SelectItem } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";
import css from "./login.scss";

export class FigmaLoginBody implements Component {
    private componentElement: HTMLElement;
    private loadingIndicator: HTMLElement;

    private teamId: string = "";
    private teams: Map<string, FigmaTeamProjectResponse> = new Map();
    private teamOptions: SelectItem[] = [
        {
            display: "Magic. Test",
            value: "1311165594770244704",
        },
    ];

    constructor(
        private figmaClient: FigmaClient,
        private updateFooter: (configs: FooterButtonConfigs) => void,
        private showLoading: () => void,
        private hideLoading: () => void,
        private teamIds: string[]
    ) {
        this.componentElement = document.createElement("div");
        this.componentElement.className = css["login"];

        this.loadingIndicator = document.createElement("div");
        this.loadingIndicator.textContent = "Loading...";

        this.renderComponent();
    }

    private createFlexContainer() {
        const container = document.createElement("div");
        container.className = css["flex-column"];
        return container;
    }

    private createUserImage(userInfo: FigmaUser) {
        const image = document.createElement("img");
        image.src = userInfo.img_url;
        image.className = css["user-image"];
        return image;
    }

    private createUserInfoText(userInfo: FigmaUser) {
        const userInfoText = document.createElement("div");
        userInfoText.className = css["user-info-text"];
        userInfoText.innerHTML = `<p>Name: ${userInfo.handle}</p><p>Email: ${userInfo.email}</p>`;
        return userInfoText;
    }

    private displayUserInfo(userInfo: FigmaUser): HTMLDivElement {
        const flexContainer = this.createFlexContainer();
        const userInfoRow = document.createElement("div");
        userInfoRow.className = css["user-info-row"];

        const userImage = this.createUserImage(userInfo);
        const userInfoText = this.createUserInfoText(userInfo);

        userInfoRow.append(userImage, userInfoText);
        flexContainer.appendChild(userInfoRow);

        return flexContainer;
    }

    private createLinkButton() {
        const linkButtonConfig: IButtonConfig = {
            text: "Connect to your Figma",
            variant: "outlined",
            color: "primary",
            onClick: () => this.onLinkClick(),
        };
        const linkButton = new ButtonComponent(linkButtonConfig);
        return linkButton.render();
    }

    private onLinkClick() {
        this.figmaClient.initiateOAuthFlow();
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
                        this.teamIds
                    );

                    this.teamOptions = Array.from(this.teams.entries()).map(
                        ([id, response]) => ({
                            display: response.name,
                            value: id,
                        })
                    );

                    this.figmaClient.fetchFigmaInformation(
                        this.updateScreen.bind(this)
                    );
                } catch (error) {
                    console.error("Error fetching Figma information:", error);
                    this.showError(error); // Handle the error
                } finally {
                    // Remove the event listener in either case
                    window.removeEventListener("message", tokenListener);
                }
            }
        };

        window.addEventListener("message", tokenListener);
    }

    private showError(error: any): void {
        this.hideLoading();

        const errorMessage = document.createElement("p");
        errorMessage.textContent = `Error: ${
            error.message || "Something went wrong"
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
        teamSelectBox.className = css["team-select"];

        // Default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select your figma team...";
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

        // Appending elements to the component
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
                return new Error("Fetch Figma team information failed");
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
