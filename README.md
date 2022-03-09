# Social Media App

![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/notalexross/d9d33cea0ee5d94633385c7dc66bd0a6/raw/429179304__badge__tests.json)
![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/notalexross/d9d33cea0ee5d94633385c7dc66bd0a6/raw/429179304__badge__coverage.json)
![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/notalexross/d9d33cea0ee5d94633385c7dc66bd0a6/raw/429179304__badge__lint.json)
![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/notalexross/d9d33cea0ee5d94633385c7dc66bd0a6/raw/429179304__badge__build.json)
![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/notalexross/d9d33cea0ee5d94633385c7dc66bd0a6/raw/429179304__badge__deploy.json)
![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/notalexross/d9d33cea0ee5d94633385c7dc66bd0a6/raw/429179304__badge__commit.json)

## Description

A social media application, powered by [Firebase](https://firebase.google.com), with Firebase Authentication, Cloud Firestore NoSQL database, and Cloud Storage. Apart from Firebase, the app consists of 100% client-side code, built upon rigorous database security rules that prevent direct-access attacks using otherwise public credentials. Built with [TypeScript](https://www.typescriptlang.org), [React](https://reactjs.org), and [Tailwind CSS](https://tailwindcss.com), it is fully responsive and highly accessible.

Create/edit/delete your own posts; like/reply to existing posts; follow other users; view recent posts by the users you follow, by a specific user, or by all users on the platform; see recommendations chosen based on the users you have recently seen and those who have recently posted; easily update your username, full name, email, and password; and more.

Demo: https://social.rossdaniel.com \
Portfolio Entry: https://rossdaniel.com/projects/social

## Prerequisites

Requires [Node.js](https://nodejs.org).

## Installation

To clone the repository and install any dependencies, run the following commands:

```sh
git clone https://github.com/notalexross/social-media-app.git
cd social-media-app
cp .env.example .env
npm install
```

Be sure to substitute your own values for the variables defined in `.env`.

## Development

To run the app in development mode, run the following command and open http://localhost:3000 to view it in the browser.

```sh
npm run start
```

## Production

To build the app for production to the `build` folder, run the following command:

```sh
npm run build
```

## Permission

You may freely clone this work and experiment with it in your local development environment, but please do not reproduce, redistribute, or present it as your own.

Copyright &copy; Daniel Ross
