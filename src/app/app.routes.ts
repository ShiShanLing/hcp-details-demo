import { Routes } from '@angular/router';
import { HcpDetailsComponent } from './hcp-details/hcp-details.component';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./hcp-details/hcp-details.routing')
    }
];
