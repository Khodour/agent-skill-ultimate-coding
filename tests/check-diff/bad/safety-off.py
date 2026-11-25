@csrf_exempt
def webhook(request):
    return handle(request)
