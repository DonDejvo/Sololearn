// ==UserScript==
// @name         Sololearn courses
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Complete courses by single click!
// @author       DonDejvo
// @match        https://www.sololearn.com/learning/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sololearn.com
// @grant        none
// @license MIT
// ==/UserScript==

(async () => {
    'use strict';


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
        static async getCourse(courseId) {
            const body = {
                id: courseId,
                includeProjects: false
            };
            return await this.postAction("https://api3.sololearn.com/GetCourse", body);
        }
        static async pushProgress(courseId, lessonId, quizId) {
            const date = new Date();
            const dateString = date.toJSON().split(".")[0];
            const body = {
                courseID: courseId,
                isShortcutMode: false,
                lessonProgress: [{
                    activeQuizID: quizId,
                    attempt: 1,
                    isStarted: false,
                    lessonID: lessonId,
                    progressDate: dateString,
                    score: 100
                }],
                pointExchanges: [],
                quizProgress: [{
                    attempt: 1,
                    progressDate: dateString,
                    quizID: quizId,
                    score: 100,
                    time: 5
                }],
                timezone: 0
            };
            return await this.postAction("https://api3.sololearn.com/PushProgress", body);
        }
    }


    class Courses {
        courseId;
        course = null;
        constructor() {
            this.init();
        }
        init() {
            this.courseId = +window.location.pathname.split("/")[2];
            const modal = this.addLoader();
            modal.style.display = "none";
            const toggleBtn = this.addToggleButton();
            toggleBtn.disabled = true;
            this.loadCourse().then(() => {
                if(this.course) toggleBtn.disabled = false;
            });
            toggleBtn.addEventListener("click", () => {
                if(!this.course) return;
                modal.style.display = "flex";
                this.completeCourse().then(() => {
                    modal.style.display = "none";
                    window.location.reload();
                });
            });
        }
        addLoader() {
            const modal = document.createElement("div");
            modal.style.display = "flex";
            modal.style.flexDirection = "column";
            modal.style.gap = "8px";
            modal.style.position = "fixed";
            modal.style.zIndex = "9999";
            modal.style.left = "0";
            modal.style.top = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "black";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";
            document.body.appendChild(modal);

            const css = window.document.styleSheets[0];
            css.insertRule(`@keyframes logo-rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(720deg); }
            }`, css.cssRules.length);

            const logo = document.createElement("img");
            logo.src = "data:image/png;base64,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";
            logo.style.animation = "logo-rotate 1s ease infinite";
            modal.appendChild(logo);

            const title = document.createElement("h1");
            title.textContent = "Course is being completed...";
            title.style.textAlign = "center";
            title.style.fontSize = "20px";
            title.style.fontFamily = '"Fira Sans",sans-serif';
            title.style.color = "white";
            modal.appendChild(title);

            return modal;
        }
        addToggleButton() {
            const toggleBtn = document.createElement("button");
            toggleBtn.classList.add("sol-button", "sol-button-primary", "sol-button-block", "sol-button-s");
            toggleBtn.textContent = "Complete course";
            toggleBtn.style.zIndex = "9998";
            toggleBtn.style.position = "fixed";
            toggleBtn.style.left = "0";
            toggleBtn.style.bottom = "0";
            toggleBtn.style.margin = "10px 10px";
            document.body.appendChild(toggleBtn);
            return toggleBtn;
        }
        async loadCourse() {
            try {
                const data = await ApiHelper.getCourse(this.courseId);
                if(data.course) this.course = data.course;
            }
            catch(err) {}
            if(!this.course) {
                console.log("Course could not be loaded.");
            }
        }
        async completeCourse() {
            for(let module of this.course.modules) {
                    for(let lesson of module.lessons) {
                        const lastQuiz = lesson.quizzes[lesson.quizzes.length - 1];
                        let result = null;
                        try {
                            result = await ApiHelper.pushProgress(this.course.id, lesson.id, lastQuiz.id);
                        }
                        catch(err) {}
                        if(result) {
                            console.log(`${lesson.name} completed successfully.`);
                        }
                        else {
                            console.log(`${lesson.name} failed to complete.`);
                        }
                        await new Promise(resolve => setTimeout(() => resolve(), 250));
                    }
                }
        }
    }

    setTimeout(() => {
        let app = new Courses();
    }, 2000);

})();
