package org.example.dao;

import org.example.model.Issue;
import java.util.List;

public interface IssueDAO {
    // 1. Submit a new issue report
    void addIssue(Issue issue);

    // 2. View all issue reports
    List<Issue> findAllIssues();

    // F14
    void updateStatus(int issueId, String status);

    // Update issue priority
    void updatePriority(int issueId, String priority);
}