import {Component, ViewEncapsulation} from '@angular/core';
import {Site} from '../../../api/services/site-service';
import {SiteService} from '../../../api/services/site-service';
import {MessageService} from '../../../api/services/messages-service';
import {BaseComponent} from '../common/_base/base-component';

@Component({
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    pipes: [],
    providers: [],
    selector: 'dot-site-selector-component',
    styleUrls: ['dot-site-selector-component.css'],
    templateUrl: ['dot-site-selector-component.html'],
})
export class SiteSelectorComponent extends BaseComponent {
    private currentSite: any;
    private sites: Site[];
    private message: string;
    private filteredSitesResults: Array<any>;

    constructor(private siteService: SiteService, messageService: MessageService) {
        super(['updated-current-site-message', 'archived-current-site-message', 'modes.Close'], messageService);
    }

    ngOnInit(): void {
        this.siteService.switchSite$.subscribe(site => this.currentSite = {
            label: site.hostName,
            value: site.identifier,
        });
        this.siteService.sites$.subscribe(sites => this.sites = sites);
        this.siteService.archivedCurrentSite$.subscribe(site => {
            this.message = this.i18nMessages['archived-current-site-message'];
        });
        this.siteService.updatedCurrentSite$.subscribe(site => {
            this.message = this.i18nMessages['updated-current-site-message'];
        });
    }

    switchSite(option: any): void {
        this.siteService.switchSite(option.value).subscribe(response => {

        });
    }

    /**
     * Filter the users displayed in the dropdown by comparing if
     * the user name characters set on the drowpdown search box matches
     * some on the user names set on the userlist variable loaded on the
     * ngOnInit method
     *
     * @param event - The event with the query parameter to filter the users
     */
    filterSites(event): void {
        this.filteredSitesResults = this.sites.
        filter( site => site.hostName.toLowerCase().indexOf(event.query.toLowerCase()) >= 0)
            .map( site => {
                return {
                    label: site.hostName,
                    value: site.identifier,
                };
            });
    }

    /**
     * Display all the existing login as users availables loaded on the
     * userList variable initialized on the ngOnInit method
     *
     * @param event - The click event to display the dropdown options
     */
    handleSitesDropdownClick(event): void {
        this.filteredSitesResults = [];

        /**
         * This time out is included to imitate a remote call and
         * avoid that the suggestion box is not displayed, because
         * the autocomplete hide method is execute after the the show
         * method.
         *
         * TODO - remove the setTimeout when we add the pagination option
         * making a call to the site service to get a subset of sites paginated
         * to display on the dropdown sugestions pannel.
         *
         */
        setTimeout(() => {
            this.filteredSitesResults = this.sites.map( site => {
                    return {
                        label: site.hostName,
                        value: site.identifier,
                    };
                });
        }, 100);

}