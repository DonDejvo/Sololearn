// ==UserScript==
// @name         Sololearn challenges
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  5 star all challenges and humilitate the beast
// @author       DonDejvo
// @match        https://www.sololearn.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sololearn.com
// @grant        none
// @license MIT
// ==/UserScript==

(async () => {
    'use strict';

    const courses = [
        { id: 1073, name: "Python" },
        { id: 1051, name: "C++" },
        { id: 1024, name: "Javascript" },
        { id: 1068, name: "Java" },
        { id: 1080, name: "C#" },
        { id: 1014, name: "HTML" },
        { id: 1059, name: "PHP" },
        { id: 1081, name: "Ruby" },
        { id: 1089, name: "C" },
    ];

    const initCourseSelect = (elem) => {
        for (let item of courses) {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            elem.appendChild(option);
        }
    }

    class ApiHelper {
        static async postAction(url, body) {
            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + JSON.parse(localStorage.getItem("accessToken")).data
                },
                referrer: "https://www.sololearn.com/",
                body: JSON.stringify(body),
                method: "POST",
                mode: "cors"
            });
            return await res.json();
        }
        static async getContestFeed() {
            const body = {};
            return await this.postAction("https://api3.sololearn.com/Challenge/GetContestFeed", body);
        }
        static async createContest(opponentId, courseId) {
            const body = {
                opponentId,
                courseId
            };
            return await this.postAction("https://api3.sololearn.com/Challenge/CreateContest", body);
        }
        static async getContest(contestId) {
            const body = {
                id: contestId
            };
            return await this.postAction("https://api3.sololearn.com/Challenge/GetContest", body);
        }
        static async pushContestResult(contestId, challengeId, isCompleted) {
            const body = {
                contestId,
                challengeId,
                isCompleted
            };
            return await this.postAction("https://api3.sololearn.com/Challenge/PushContestResult", body);
        }
        static async declineContest(contestId) {
            const body = {
                id: contestId
            };
            return await this.postAction("https://api3.sololearn.com/Challenge/DeclineContest", body);
        }
    }

    class Challenges {
        body;
        refreshBtn;
        loading = false;
        constructor() {
            this.init();
        }
        init() {
            const toggleBtn = this.addToggleButton();
            const { modal, challengesBody, refreshBtn } = this.addModalPopup();
            this.body = challengesBody;
            this.refreshBtn = refreshBtn;
            modal.style.display = "none";
            toggleBtn.addEventListener("click", () => {
                modal.style.display = "flex";
            });
            this.loadChallenges();
            addEventListener("click", ev => {
                if (ev.target.classList.contains("challenge-accept-btn")) {
                    const id = parseInt(ev.target.dataset.id);
                    this.acceptChallenge(id);
                }
                else if (ev.target.classList.contains("challenge-decline-btn")) {
                    const id = parseInt(ev.target.dataset.id);
                    ApiHelper.declineContest(id).then(() => {
                        this.loadChallenges();
                    });
                }
            });
        }

        async acceptChallenge(id) {
            let score = -1;
            try {
                score = parseInt(prompt("Enter your score:"));
            }
            catch (err) { }
            if (score < 0 || score > 5) {
                alert("Score must be in range 0 - 5.");
                return;
            }

            let contest = null;
            try {
                const data = await ApiHelper.getContest(id);
                if (data.contest) contest = data.contest;
            }
            catch (err) { }
            if (!contest) {
                alert("Could not open the challenge.");
                return;
            }
            let startIdx = contest.player.activeChallengeID ? contest.challenges.findIndex(e => e.id == contest.player.activeChallengeID) : 0;
            for (let i = startIdx; i < 5; ++i) {
                const challenge = contest.challenges[i];
                try {
                    await ApiHelper.pushContestResult(contest.id, challenge.id, i < score);
                }
                catch (err) { }
            }
            alert(`Challenge completed ${score} : ${contest.opponent.score}.`);
            this.loadChallenges();
        }
        addModalPopup() {
            const modal = document.createElement("div");
            modal.style.display = "flex";
            modal.style.position = "fixed";
            modal.style.zIndex = "9999";
            modal.style.left = "0";
            modal.style.top = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";
            document.body.appendChild(modal);

            const container = document.createElement("div");
            container.style.position = "relative";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "8px";
            container.style.width = "800px";
            container.style.height = "800px";
            container.style.maxHeight = "80vh";
            container.style.backgroundColor = "#fff";
            container.style.padding = "18px 12px";
            container.style.borderRadius = "8px";
            modal.appendChild(container);

            const closeBtn = document.createElement("div");
            closeBtn.innerHTML = `
            <div style="cursor: pointer; color: #9b9b9b; height: 13px;width: 13px;">
                <svg style="width: 100%; height: 100%;"><use xlink:href="#close"></use></svg>
            </div>`;
            closeBtn.style.margin = "12px";
            closeBtn.style.position = "absolute";
            closeBtn.style.right = "0";
            closeBtn.style.top = "0";
            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
            container.appendChild(closeBtn);

            const refreshBtn = document.createElement("button");
            refreshBtn.textContent = "Refresh";
            refreshBtn.classList.add("sol-button", "sol-button-primary", "sol-button-block", "sol-button-s");
            refreshBtn.style.margin = "12px";
            refreshBtn.style.position = "absolute";
            refreshBtn.style.left = "0";
            refreshBtn.style.top = "0";
            container.appendChild(refreshBtn);
            refreshBtn.addEventListener("click", () => {
                this.loadChallenges();
            });

            const title = document.createElement("h1");
            title.textContent = "Challenges";
            title.style.textAlign = "center";
            title.style.fontSize = "20px";
            container.appendChild(title);

            const body = document.createElement("div");
            body.style.width = "100%";
            body.style.height = "calc(100% - 64px)";
            body.style.overflowY = "auto";
            body.style.display = "flex";
            body.style.flexDirection = "column";
            body.style.gap = "6px";
            container.appendChild(body);

            const showStartChallengeBtn = document.createElement("button");
            showStartChallengeBtn.textContent = "Start challenge";
            showStartChallengeBtn.classList.add("sol-button", "sol-button-primary", "sol-button-block", "sol-button-s");
            container.appendChild(showStartChallengeBtn);

            const renderStartChallengeForm = () => {
                const StartChallengeForm = document.createElement("div");
                StartChallengeForm.style.display = "none";
                StartChallengeForm.style.width = "100%";
                StartChallengeForm.style.padding = "8px 16px";
                StartChallengeForm.style.backgroundColor = "#f2f5f7";
                StartChallengeForm.style.borderRadius = "8px";

                const formBody = document.createElement("div");

                const userIdInputContainer = document.createElement("div");
                userIdInputContainer.classList.add("sl-p-form-field");
                const userIdInputLabel = document.createElement("label");
                userIdInputLabel.classList.add("sl-p-form-field__label");
                userIdInputLabel.textContent = "Opponent ID";
                userIdInputContainer.appendChild(userIdInputLabel);
                const userIdInput = document.createElement("input");
                userIdInput.classList.add("sl-p-form-field__input");
                userIdInput.placeholder = "Fill ID of your opponent or leave blank for random";
                userIdInputContainer.appendChild(userIdInput);
                formBody.appendChild(userIdInputContainer);

                const courseInputContainer = document.createElement("div");
                courseInputContainer.classList.add("sl-p-form-field");
                const courseInputLabel = document.createElement("label");
                courseInputLabel.classList.add("sl-p-form-field__label");
                courseInputLabel.textContent = "Course";
                courseInputContainer.appendChild(courseInputLabel);
                const courseInput = document.createElement("select");
                courseInput.classList.add("sl-p-form-field__input");
                courseInputContainer.appendChild(courseInput);
                formBody.appendChild(courseInputContainer);

                const scoreInputContainer = document.createElement("div");
                scoreInputContainer.classList.add("sl-p-form-field");
                const scoreInputLabel = document.createElement("label");
                scoreInputLabel.classList.add("sl-p-form-field__label");
                scoreInputLabel.textContent = "Score";
                scoreInputContainer.appendChild(scoreInputLabel);
                const scoreInput = document.createElement("input");
                scoreInput.type = "number";
                scoreInput.min = 0;
                scoreInput.max = 5;
                scoreInput.value = 5;
                scoreInput.classList.add("sl-p-form-field__input");
                scoreInputContainer.appendChild(scoreInput);
                formBody.appendChild(scoreInputContainer);

                initCourseSelect(courseInput);

                StartChallengeForm.appendChild(formBody);

                const buttonContainer = document.createElement("div");
                buttonContainer.style.display = "flex";
                buttonContainer.style.gap = "8px";
                buttonContainer.style.marginTop = "6px";
                StartChallengeForm.appendChild(buttonContainer);

                const postButton = document.createElement("button");
                postButton.classList.add("sol-button", "sol-button-primary", "sol-button-block", "sol-button-s");
                buttonContainer.appendChild(postButton);
                postButton.textContent = "Submit";
                postButton.addEventListener("click", () => {
                    const opponentId = +userIdInput.value;
                    const score = +scoreInput.value;
                    const courseId = +courseInput.value;
                    this.startChallenge(opponentId, courseId, score).then(() => {
                        showStartChallengeBtn.style.display = "block";
                        StartChallengeForm.style.display = "none";
                        userIdInput.value = "";
                        this.loadChallenges();
                    });
                });

                const cancelButton = document.createElement("button");
                cancelButton.classList.add("sol-button", "sol-button-primary", "sol-button-block", "sol-button-s");
                buttonContainer.appendChild(cancelButton);
                cancelButton.textContent = "Cancel";
                cancelButton.addEventListener("click", () => {
                    showStartChallengeBtn.style.display = "block";
                    StartChallengeForm.style.display = "none";
                });

                return {
                    StartChallengeForm,
                    postButton,
                    cancelButton
                };
            }

            const { StartChallengeForm } = renderStartChallengeForm();
            container.appendChild(StartChallengeForm);

            showStartChallengeBtn.addEventListener("click", () => {
                showStartChallengeBtn.style.display = "none";
                StartChallengeForm.style.display = "block";
            });

            return {
                modal,
                challengesBody: body,
                refreshBtn
            };
        }
        async startChallenge(opponentId, courseId, score) {
            const data = await ApiHelper.createContest(opponentId, courseId);
            if (!data.contest) {
                alert("Unable to start contest.");
                return;
            }
            for (let i = 0; i < 5; ++i) {
                const challenge = data.contest.challenges[i];
                await ApiHelper.pushContestResult(data.contest.id, challenge.id, i < score);
            }
        }
        addToggleButton() {
            const toggleBtn = document.createElement("button");
            toggleBtn.classList.add("sol-button", "sol-button-primary", "sol-button-block", "sol-button-s");
            toggleBtn.textContent = "Challenges";
            toggleBtn.style.zIndex = "9998";
            toggleBtn.style.position = "fixed";
            toggleBtn.style.right = "0";
            toggleBtn.style.bottom = "0";
            toggleBtn.style.margin = "10px 10px";
            document.body.appendChild(toggleBtn);
            return toggleBtn;
        }
        async loadChallenges() {
            const { body, refreshBtn } = this;
            while (body.firstChild) {
                body.removeChild(body.lastChild);
            }
            let feed = null;
            this.loading = true;
            refreshBtn.disabled = true;
            try {
                const data = await ApiHelper.getContestFeed();
                if (data.feed) feed = data.feed;
            }
            catch (err) { }
            this.loading = false;
            refreshBtn.disabled = false;
            if (feed == null) {
                const p = document.createElement("p");
                p.style.fontSize = "18px";
                p.style.margin = "10px 0px";
                p.style.color = "red";
                p.textContent = "Failed to load. Try again!";
                body.appendChild(p);
                return;
            }

            if (!feed.length) {
                const p = document.createElement("p");
                p.style.fontSize = "18px";
                p.style.margin = "10px 0px";
                p.textContent = "You have no challenges at the moment.";
                body.appendChild(p);
                return;
            }
            for (let challenge of feed) {
                const elem = Challenges.createChallenge(challenge);
                body.appendChild(elem);
            }
        }
        static createChallenge(challenge) {
            const container = document.createElement("div");
            container.classList.add("challenge");
            container.dataset.id = challenge.id;
            container.style.width = "100%";
            let html = `<div class="challenge-body" style="display:flex; justify-content: space-between; gap: 6px; padding: 6px 8px; background-color:#fff; border-radius: 8px; border: none; box-sizing: border-box;">
                <div style='display: flex; gap: 6px; flex-basis: 40%;'>
                    <img style="width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex-shrink: 0;" src="${challenge.opponent.avatarUrl}" alt="${challenge.opponent.name} - avatar">
                    <div><a style="cursor: pointer; color: #2493df;" href="https://www.sololearn.com/profile/${challenge.opponent.id}">${challenge.opponent.name}</a></div>
                </div>
                <div style="display: flex;">
                    <div style='font-weight: bold; font-size: 18px; align-self: center;'>${challenge.player.score} : ${challenge.opponent.score}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center;">
                            <span style="visibility: ${challenge.player.status == 6 ? "visible" : "collapse"}; padding: 6px; background: red; color: white; align-self: center; border-radius: 6px;">Declined</span>
                            <span style="visibility: ${challenge.player.status == 5 ? "visible" : "collapse"}; padding: 6px; background: silver; color: white; align-self: center; border-radius: 6px;">Waiting</span>
                            <button data-id="${challenge.id}" class="challenge-accept-btn sol-button sol-button-primary sol-button-block sol-button-s" style="visibility: ${challenge.player.status == 3 || challenge.player.status == 4 ? "visible" : "collapse"};">Accept</button>
                            <button data-id="${challenge.id}" class="challenge-decline-btn sol-button sol-button-primary sol-button-block sol-button-s" style="visibility: ${challenge.player.status == 3 || challenge.player.status == 4 ? "visible" : "collapse"};">Decline</button>
                        </div>
                </div>
            `;
            container.innerHTML = html;
            return container;
        }
    }

    setTimeout(() => {
        let app = new Challenges();
    }, 2000);

})();
