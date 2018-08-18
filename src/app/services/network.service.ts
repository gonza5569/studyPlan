import { Injectable } from '@angular/core';

import { DataSet } from 'vis';
import * as _ from 'lodash';

import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormModalComponent } from '../components/shared/form-modal/form-modal.component';

import { SubjectService } from './subject.service';
import { StudentService } from './student.service';
import { Subject } from '../models/subject/subject';
import { Student } from '../models/student/student';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  // dataset: Observable<{ nodes: DataSet, links: DataSet }>;
  subjects: Subject[];
  student: Student;
  dataset: { nodes: any, links: any };

  constructor(
    private subjectService: SubjectService
    , private studentService: StudentService
    , private modalService: NgbModal
  ) { }

  set(student: Student, subjects: Subject[]) {
    this.student = student || new Student();
    this.subjects = subjects || [] as Subject[];
  }

  getDataSet() {
    let links = [];

    const nodes = this.subjects
    .map(element => {
      const node = this.generateNode(element);
      links = this.getLinks(element, links);
      return node;
    });
    this.dataset = { nodes, links };
    return this.dataset;
  }

  generateNode(subject) {
    return {
      id: subject.$key,
      name: subject.name,
      quarter: subject.quarter,
      year: subject.year,
      group: this.student['$key'] ? this.getSubjectState(subject) : subject.year,
    };
  }

  getSubjectState(subject: Subject) {
    let group = 'notAvailable';
    const subjectKey = subject.$key;

    const correlatives = subject.correlatives || { approved: [], regularized: [] };
    const approved = correlatives['approved'] || [];
    const regularized = correlatives['regularized'] || [];
    const realRegularized = _.difference(regularized, approved);

    const studentApproved = this.student['approved'] || [];
    const studentRegularized = this.student['regularized'] || [];
    const studentInProgress = this.student['inProgress'] || [];

    const isApproved = _.includes(studentApproved, subjectKey);
    const isRegularized = _.includes(studentRegularized, subjectKey);
    const isInProgress = _.includes(studentInProgress, subjectKey);
    const isAvailable = approved.every((key) => _.includes(studentApproved, key));

    if (isApproved) {
      group = 'approved';
    } else if (isRegularized) {
      group = 'regularized';
    } else if (isInProgress) {
      group = 'inProgress';
    } else if (isAvailable) {
      group = 'available';
    }
    return group;
  }

  getLinks(subject, links) {
    const correlatives = subject.correlatives || { approved: [], regularized: [] };
    const approved = correlatives['approved'] || [];
    const regularized = correlatives['regularized'] || [];
    const realRegularized = _.difference(regularized, approved);

    approved.forEach(i => {
      links.push({
        source: i,
        target: subject.$key,
        distance: subject.year
      });
    });

    realRegularized.forEach(i => {
      links.push({
        source: i,
        target: subject.$key,
        distance: subject.year
      });
    });

    return links;
  }

  getSubjectName(subjectKey) {
    return this.subjects.find(s => s.$key === subjectKey).name;
  }
}
