renderCardButton();
observeTicketSubjectChanges();

const getBrowser = () => {
	if (typeof chrome !== 'undefined') {
		if (typeof browser !== 'undefined') {
			return Object.assign(browser, {
				action: browser.browserAction,
				scripting: {
					executeScript: ({ target, files }, cb) => {
						browser.tabs.executeScript(target.tabId, { file: files[0] }, cb);
					},
					insertCSS: ({ target, files }) => {
						browser.tabs.insertCSS(target.tabId, { file: files[0] });
					},
				},
			});
		} else {
			return chrome;
		}
	} else {
		return createBrowser();
	}
};

const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.type === 'characterData') {
			renderCardButton();
		}
	});
});

function renderCardButton() {
	removeExistingClockifyButton();

	setTimeout(() => {
		clockifyButton.render(
			'.page-actions__left:not(.clockify)',
			{ observe: true },
			(elem) => {
				const ticketNumber = () => $('.breadcrumb__item.active').innerText;
				const description = () => `#${ticketNumber()} `;

				const timeEl = document.createElement('span');
				timeEl.classList.add('clockify-btn-time');
				elem.append(timeEl);

				const link = clockifyButton.createButton({ description });

				link.style.marginLeft = '10px';
				link.style.display = 'inline-flex';
				link.style.verticalAlign = 'middle';

				elem.append(link);

				const aBrowser = getBrowser();
				aBrowser.runtime.sendMessage(
					{
						eventName: 'fetchEntryInProgress',
					},
					(response) => {
						if (!('entry' in response) || response.entry === null) {
							return;
						}

						const currentTimeInterval = new Date(response.entry.timeInterval.start);

						const getTimeDiff = () => {
							let timeDiff = (new Date()).getTime() - currentTimeInterval.getTime();

							const hours = Math.floor(timeDiff / (1000 * 60 * 60));
							timeDiff = timeDiff % (1000 * 60 * 60);
							const minutes = Math.floor(timeDiff / (1000 * 60));
							timeDiff = timeDiff % (1000 * 60);
							const seconds = Math.floor(timeDiff / 1000);

							return  (
								hours < 10 ? '0' + hours : hours
							) + ':' + (
								minutes < 10 ? '0' + minutes : minutes
							) + ':' + (
								seconds < 10 ? '0' + seconds : seconds
							)
						};

						timeEl.innerText = getTimeDiff();

						setInterval(() => {
							timeEl.innerText = getTimeDiff();
						}, 1000);

						const ticketMatches = response.entry.description.match(/^#([0-9]+)/);
						const ticketMatchesUrl = window.location.href.match(/tickets\/([0-9]+)$/);

						if (ticketMatches) {
							if (ticketMatchesUrl && ticketMatches[1] === ticketMatchesUrl[1]) {
								timeEl.classList.add('clockify-btn-time-current');
							} else {
								timeEl.classList.add('clockify-btn-time-other');
							}
						} else {
							timeEl.classList.add('clockify-btn-time-other');
						}
					}
				);

				elem.append(link);
			}
		);
	}, 700);
}

function removeExistingClockifyButton() {
	$('#clockifyButton')?.remove();
	$('.clockify')?.classList?.remove('clockify');
}

function observeTicketSubjectChanges() {
	const observer = new MutationObserver(renderCardButton);

	const intervalId = setInterval(() => {
		const ticketSubjectContainer = $('.ticket-details-header');

		if (!ticketSubjectContainer) return;

		observer.observe(ticketSubjectContainer, {
			subtree: true,
			characterData: true,
		});

		clearInterval(intervalId);
	}, 3000);
}
