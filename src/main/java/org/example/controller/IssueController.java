package org.example.controller;

import org.example.model.Issue;
import org.example.service.IssueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    @Autowired
    private IssueService issueService;

    // F13: 用户报告问题 User reports a new issue
    @PostMapping("/report")
    public String reportIssue(@RequestBody Issue issue) {
        issueService.reportIssue(issue);
        return "Thank you! Your issue report has been submitted.";
    }

    // For Admin: View all reported issues
    @GetMapping
    public List<Issue> getAllIssues() {
        return issueService.viewAllIssues();
    }
}