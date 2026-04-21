package org.example.service;

import org.example.model.Issue;
import java.util.List;

public interface IssueService {

    void reportIssue(Issue issue);
    List<Issue> viewAllIssues();
}