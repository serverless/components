# -*- coding: utf8 -*-


def teacher_go():
    # todo: teacher_go action
    return {
        "result": "it is student_get action"
    }


def student_go():
    # todo: student_go action
    return {
        "result": "it is teacher_put action"
    }


def student_come():
    # todo: student_come action
    return {
        "result": "it is teacher_put action"
    }


def main_handler(event, context):
    print(str(event))
    if event["pathParameters"]["user_type"] == "teacher":
        if event["pathParameters"]["action"] == "go":
            return teacher_go()
    if event["pathParameters"]["user_type"] == "student":
        if event["pathParameters"]["action"] == "go":
            return student_go()
        if event["pathParameters"]["action"] == "come":
            return student_come()
